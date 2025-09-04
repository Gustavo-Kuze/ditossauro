import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, Notification } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import { VoiceFlowApp } from './voice-flow-app';
import { AppSettings } from './types';

dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

class VoiceFlowElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private voiceFlowApp: VoiceFlowApp;
  private isQuitting = false;

  constructor() {
    // Inicializar VoiceFlowApp para registrar handlers IPC
    this.voiceFlowApp = new VoiceFlowApp();
    this.setupVoiceFlowListeners();
  }

  createWindow(): void {
  // Create the browser window.
    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 600,
      minHeight: 500,
      show: false, // Não mostrar inicialmente
      icon: this.getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
    },
  });

    // Load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      this.mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Setup window events
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
        
        // Mostrar notificação informando que o app continua rodando
        if (Notification.isSupported()) {
          new Notification({
            title: 'VoiceFlow AI',
            body: 'Aplicativo minimizado para a bandeja do sistema',
          }).show();
        }
      }
    });

    this.mainWindow.on('ready-to-show', () => {
      // Atualizar referência da janela no VoiceFlowApp
      this.voiceFlowApp.setMainWindow(this.mainWindow);
      
      // Injetar Web Audio Recorder
      this.injectWebAudioRecorder();
      
      // Mostrar apenas se não for para iniciar minimizado
      const settings = this.voiceFlowApp.getSettings();
      if (!settings.behavior?.startMinimized) {
        this.mainWindow?.show();
      }
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  createTray(): void {
    const trayIcon = this.getAppIcon();
    this.tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'VoiceFlow AI',
        type: 'normal',
        enabled: false,
      },
      {
        type: 'separator',
      },
      {
        label: 'Abrir Interface',
        type: 'normal',
        click: () => this.showWindow(),
      },
      {
        label: 'Status',
        type: 'submenu',
        submenu: [
          {
            label: this.voiceFlowApp.getRecordingState().isRecording ? '🎤 Gravando...' : '⏹️ Parado',
            enabled: false,
          },
          {
            type: 'separator',
          },
          {
            label: 'Iniciar Gravação',
            click: () => this.voiceFlowApp.startRecording().catch(console.error),
            enabled: !this.voiceFlowApp.getRecordingState().isRecording,
          },
          {
            label: 'Parar Gravação',
            click: () => this.voiceFlowApp.stopRecording().catch(console.error),
            enabled: this.voiceFlowApp.getRecordingState().isRecording,
          },
        ],
      },
      {
        type: 'separator',
      },
      {
        label: 'Configurações',
        type: 'normal',
        click: () => this.showWindow('settings'),
      },
      {
        label: 'Histórico',
        type: 'normal',
        click: () => this.showWindow('history'),
      },
      {
        type: 'separator',
      },
      {
        label: 'Sair',
        type: 'normal',
        click: () => this.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('VoiceFlow AI - Transcrição de Voz');

    this.tray.on('click', () => {
      this.showWindow();
    });
  }

  setupGlobalShortcuts(): void {
    const settings = this.voiceFlowApp.getSettings();

    // Registrar hotkey para iniciar/parar gravação
    const startStopShortcut = settings.hotkeys.startStop;
    if (startStopShortcut) {
      const success = globalShortcut.register(startStopShortcut, async () => {
        const isRecording = this.voiceFlowApp.getRecordingState().isRecording;
        
        if (isRecording) {
          await this.voiceFlowApp.stopRecording();
        } else {
          await this.voiceFlowApp.startRecording();
        }
      });

      if (success) {
        console.log(`✅ Hotkey ${startStopShortcut} registrada`);
  } else {
        console.error(`❌ Falha ao registrar hotkey ${startStopShortcut}`);
      }
    }

    // Registrar hotkey para cancelar
    const cancelShortcut = settings.hotkeys.cancel;
    if (cancelShortcut) {
      globalShortcut.register(cancelShortcut, () => {
        if (this.voiceFlowApp.getRecordingState().isRecording) {
          // Para a gravação sem processar
          console.log('⏹️ Gravação cancelada pelo usuário');
        }
      });
    }
  }

  setupIpcHandlers(): void {
    // Handlers específicos do Electron App (não do VoiceFlowApp)
    
    // Reregistrar hotkeys quando configurações de hotkey mudarem
    ipcMain.on('hotkeys-updated', () => {
      globalShortcut.unregisterAll();
      this.setupGlobalShortcuts();
    });
  }

  setupVoiceFlowListeners(): void {
    this.voiceFlowApp.on('recording-started', () => {
      this.sendToRenderer('recording-started');
      this.updateTrayMenu();
    });

    this.voiceFlowApp.on('recording-stopped', () => {
      this.sendToRenderer('recording-stopped');
      this.updateTrayMenu();
    });

    this.voiceFlowApp.on('processing-started', () => {
      this.sendToRenderer('processing-started');
    });

    this.voiceFlowApp.on('transcription-completed', (session) => {
      this.sendToRenderer('transcription-completed', session);
      
      if (Notification.isSupported()) {
        new Notification({
          title: 'Transcrição Concluída',
          body: session.transcription.substring(0, 100) + '...',
        }).show();
      }
    });

    this.voiceFlowApp.on('text-inserted', (text) => {
      this.sendToRenderer('text-inserted', text);
    });

    this.voiceFlowApp.on('error', (error) => {
      console.error('VoiceFlow Error:', error);
      this.sendToRenderer('error', error.message);
    });
  }

  sendToRenderer(event: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(event, data);
    }
  }

  updateTrayMenu(): void {
    if (!this.tray) return;
    
    const isRecording = this.voiceFlowApp.getRecordingState().isRecording;
    const contextMenu = this.tray.getContextMenu();
    
    if (contextMenu) {
      // Atualizar itens do menu baseado no estado
      // Esta implementação seria expandida conforme necessário
    }
  }

  showWindow(page?: string): void {
    if (!this.mainWindow) {
      this.createWindow();
    }

    if (this.mainWindow) {
      if (page) {
        this.mainWindow.webContents.send('navigate-to', page);
      }
      
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  quit(): void {
    this.isQuitting = true;
    globalShortcut.unregisterAll();
    this.voiceFlowApp.destroy();
    app.quit();
  }

  private getAppIcon(): nativeImage {
    // Criar um ícone simples programaticamente ou usar um arquivo
    // Por simplicidade, retornamos um ícone vazio
    return nativeImage.createEmpty();
  }

  private injectWebAudioRecorder(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    // Injetar Web Audio Recorder no renderer process
    this.mainWindow.webContents.executeJavaScript(`
      class WebAudioRecorderRenderer {
        constructor() {
          this.mediaRecorder = null;
          this.audioChunks = [];
          this.isRecording = false;
          this.startTime = null;
          this.stream = null;
        }

        async startRecording() {
          if (this.isRecording) {
            console.log('Já está gravando...');
            return;
          }

          try {
            console.log('🎤 Iniciando gravação com Web Audio API...');
            
            this.stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            });

            let options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              if (MediaRecorder.isTypeSupported('audio/wav')) {
                options.mimeType = 'audio/wav';
              } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options.mimeType = 'audio/mp4';
              } else {
                options = {};
              }
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];
            this.isRecording = true;
            this.startTime = Date.now();

            this.mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                this.audioChunks.push(event.data);
              }
            };

            this.mediaRecorder.start(100);
            
            // Notificar o main process
            window.electronAPI.sendAudioEvent('recording-started');
            
            return true;
          } catch (error) {
            this.isRecording = false;
            let errorMessage = 'Erro ao acessar microfone';
            if (error.name === 'NotAllowedError') {
              errorMessage = 'Permissão negada para acessar o microfone. Habilite o acesso ao microfone nas configurações do navegador.';
            } else if (error.name === 'NotFoundError') {
              errorMessage = 'Nenhum microfone encontrado no sistema';
            } else if (error.name === 'NotReadableError') {
              errorMessage = 'Microfone está sendo usado por outro aplicativo';
            }
            window.electronAPI.sendAudioEvent('error', errorMessage);
            throw new Error(errorMessage);
          }
        }

        async stopRecording() {
          if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Não está gravando');
          }

          return new Promise((resolve, reject) => {
            const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
            
            this.mediaRecorder.onstop = async () => {
              try {
                if (this.audioChunks.length === 0) {
                  throw new Error('Nenhum áudio foi gravado');
                }

                const audioBlob = new Blob(this.audioChunks, { 
                  type: this.audioChunks[0]?.type || 'audio/webm' 
                });
                
                const arrayBuffer = await audioBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                console.log(\`📦 Áudio capturado: \${uint8Array.length} bytes, \${duration.toFixed(1)}s\`);
                
                // Enviar dados para o main process
                const result = await window.electronAPI.processAudioData(Array.from(uint8Array), duration);
                resolve(result);
              } catch (error) {
                console.error('Erro ao processar áudio:', error);
                reject(error);
              }
            };

            this.mediaRecorder.stop();
            this.isRecording = false;
            
            if (this.stream) {
              this.stream.getTracks().forEach(track => track.stop());
              this.stream = null;
            }
            
            window.electronAPI.sendAudioEvent('recording-stopped', { duration });
          });
        }

        getRecordingState() {
          return { isRecording: this.isRecording };
        }

        async getAudioDevices() {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
          } catch (error) {
            console.error('Erro ao listar dispositivos:', error);
            return [];
          }
        }
      }

      // Disponibilizar globalmente
      window.audioRecorder = new WebAudioRecorderRenderer();
      console.log('✅ WebAudioRecorder injetado com sucesso');
    `).catch(console.error);
  }
}

// Inicializar aplicação
const voiceFlowElectronApp = new VoiceFlowElectronApp();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  voiceFlowElectronApp.createWindow();
  voiceFlowElectronApp.createTray();
  voiceFlowElectronApp.setupGlobalShortcuts();
  voiceFlowElectronApp.setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      voiceFlowElectronApp.createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    voiceFlowElectronApp.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
