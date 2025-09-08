import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, Notification } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import { OpenWisprApp } from './openwispr-app';
import { AppSettings } from './types';

dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

class OpenWisprElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private openWisprApp: OpenWisprApp;
  private isQuitting = false;

  constructor() {
    // Inicializar OpenWisprApp para registrar handlers IPC
    this.openWisprApp = new OpenWisprApp();
    this.setupOpenWisprListeners();
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
            title: 'OpenWispr',
            body: 'Aplicativo minimizado para a bandeja do sistema',
          }).show();
        }
      }
    });

    this.mainWindow.on('ready-to-show', () => {
      // Atualizar referência da janela no OpenWisprApp
      this.openWisprApp.setMainWindow(this.mainWindow);
      
      // Injetar Web Audio Recorder
      this.injectWebAudioRecorder();
      
      // Mostrar apenas se não for para iniciar minimizado
      const settings = this.openWisprApp.getSettings();
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
        label: 'OpenWispr',
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
            label: this.openWisprApp.getRecordingState().isRecording ? '🎤 Gravando...' : '⏹️ Parado',
            enabled: false,
          },
          {
            type: 'separator',
          },
          {
            label: 'Iniciar Gravação',
            click: () => this.openWisprApp.startRecording().catch(console.error),
            enabled: !this.openWisprApp.getRecordingState().isRecording,
          },
          {
            label: 'Parar Gravação',
            click: () => this.openWisprApp.stopRecording().catch(console.error),
            enabled: this.openWisprApp.getRecordingState().isRecording,
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
    this.tray.setToolTip('OpenWispr - Transcrição de Voz');

    this.tray.on('click', () => {
      this.showWindow();
    });
  }

  setupGlobalShortcuts(): void {
    const settings = this.openWisprApp.getSettings();

    // Registrar hotkey para iniciar/parar gravação
    const startStopShortcut = settings.hotkeys.startStop;
    if (startStopShortcut) {
      const success = globalShortcut.register(startStopShortcut, async () => {
        const isRecording = this.openWisprApp.getRecordingState().isRecording;
        
        if (isRecording) {
          await this.openWisprApp.stopRecording();
        } else {
          await this.openWisprApp.startRecording();
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
        if (this.openWisprApp.getRecordingState().isRecording) {
          // Para a gravação sem processar
          console.log('⏹️ Gravação cancelada pelo usuário');
        }
      });
    }
  }

  setupIpcHandlers(): void {
    // Handlers específicos do Electron App (não do OpenWisprApp)
    
    // Reregistrar hotkeys quando configurações de hotkey mudarem
    ipcMain.on('hotkeys-updated', () => {
      globalShortcut.unregisterAll();
      this.setupGlobalShortcuts();
    });
  }

  setupOpenWisprListeners(): void {
    this.openWisprApp.on('recording-started', () => {
      this.sendToRenderer('recording-started');
      this.updateTrayMenu();
    });

    this.openWisprApp.on('recording-stopped', () => {
      this.sendToRenderer('recording-stopped');
      this.updateTrayMenu();
    });

    this.openWisprApp.on('processing-started', () => {
      this.sendToRenderer('processing-started');
    });

    this.openWisprApp.on('transcription-completed', (session) => {
      this.sendToRenderer('transcription-completed', session);
      
      if (Notification.isSupported()) {
        new Notification({
          title: 'Transcrição Concluída',
          body: session.transcription.substring(0, 100) + '...',
        }).show();
      }
    });

    this.openWisprApp.on('text-inserted', (text) => {
      this.sendToRenderer('text-inserted', text);
    });

    this.openWisprApp.on('error', (error) => {
      console.error('OpenWispr Error:', error);
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
    
    // Recriar o menu ao invés de tentar atualizar o existente
    const isRecording = this.openWisprApp.getRecordingState().isRecording;
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'OpenWispr',
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
            label: isRecording ? '🎤 Gravando...' : '⏹️ Parado',
            enabled: false,
          },
          {
            type: 'separator',
          },
          {
            label: 'Iniciar Gravação',
            click: () => this.openWisprApp.startRecording().catch(console.error),
            enabled: !isRecording,
          },
          {
            label: 'Parar Gravação',
            click: () => this.openWisprApp.stopRecording().catch(console.error),
            enabled: isRecording,
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
    this.openWisprApp.destroy();
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

            // Tentar diferentes formatos em ordem de preferência
            let options = {};
            
            if (MediaRecorder.isTypeSupported('audio/wav')) {
              options = { mimeType: 'audio/wav' };
              console.log('📻 Usando formato: audio/wav');
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
              options = { mimeType: 'audio/webm;codecs=opus' };
              console.log('📻 Usando formato: audio/webm;codecs=opus');
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
              options = { mimeType: 'audio/webm' };
              console.log('📻 Usando formato: audio/webm');
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
              options = { mimeType: 'audio/mp4' };
              console.log('📻 Usando formato: audio/mp4');
            } else {
              console.log('📻 Usando formato padrão do navegador');
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

                // Obter o tipo MIME do primeiro chunk
                const mimeType = this.audioChunks[0]?.type || 'audio/webm';
                console.log(\`🎵 Tipo MIME detectado: \${mimeType}\`);
                
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                
                // Verificar se o blob tem conteúdo
                if (audioBlob.size === 0) {
                  throw new Error('Arquivo de áudio vazio');
                }
                
                const arrayBuffer = await audioBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                console.log(\`📦 Áudio capturado: \${uint8Array.length} bytes, \${duration.toFixed(1)}s, tipo: \${mimeType}\`);
                
                // Log dos primeiros bytes para debug
                const firstBytes = Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
                console.log(\`🔍 Primeiros bytes: \${firstBytes}\`);
                
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
const openWisprElectronApp = new OpenWisprElectronApp();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  openWisprElectronApp.createWindow();
  openWisprElectronApp.createTray();
  openWisprElectronApp.setupGlobalShortcuts();
  openWisprElectronApp.setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      openWisprElectronApp.createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    openWisprElectronApp.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
