import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, Notification, NativeImage, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import { OpenWisprApp } from './openwispr-app';
import { HotkeyManager } from './hotkey-manager';

dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

class OpenWisprElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private floatingWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private openWisprApp: OpenWisprApp;
  private hotkeyManager: HotkeyManager;
  private isQuitting = false;
  private trayIcons: {
    idle: NativeImage;
    recording: NativeImage;
    processing: NativeImage;
  };

  constructor() {
    // Inicializar OpenWisprApp para registrar handlers IPC
    this.openWisprApp = new OpenWisprApp();
    this.hotkeyManager = new HotkeyManager();

    // Create tray icons
    this.trayIcons = {
      idle: this.createTrayIcon('idle'),
      recording: this.createTrayIcon('recording'),
      processing: this.createTrayIcon('processing'),
    };

    this.setupOpenWisprListeners();
    this.setupHotkeyListeners();
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

  createFloatingWindow(): void {
    if (this.floatingWindow) {
      this.floatingWindow.showInactive();
      return;
    }

    // Get primary display dimensions
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Window dimensions
    const windowWidth = 300;
    const windowHeight = 100;

    // Calculate position: centered horizontally, at bottom of screen
    const x = Math.floor((screenWidth - windowWidth) / 2);
    const y = screenHeight - windowHeight;

    this.floatingWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false, // Don't show immediately
      focusable: false, // Prevent window from stealing focus
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // this.floatingWindow.center();

    // Load the floating window
    // Check if we're in development mode using the main window constant
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      // In development, floating window is served on port 5174
      this.floatingWindow.loadURL('http://localhost:5174');
    } else {
      // In production, load the built file
      this.floatingWindow.loadFile(path.join(__dirname, '../renderer/floating_window/floating_window.html'));
    }

    // Debug: Log when the page finishes loading
    this.floatingWindow.webContents.on('did-finish-load', () => {
      console.log('✅ Floating window loaded successfully');
      // Show the window without stealing focus
      this.floatingWindow?.showInactive();
    });

    this.floatingWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('❌ Floating window failed to load:', errorDescription, 'URL:', validatedURL);
    });

    // Handle window close
    this.floatingWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.floatingWindow?.hide();
      }
    });

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.floatingWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }

  showFloatingWindow(): void {
    if (!this.floatingWindow) {
      this.createFloatingWindow();
    } else {
      // Use showInactive to show window without stealing focus
      this.floatingWindow.showInactive();
    }
  }

  hideFloatingWindow(): void {
    if (this.floatingWindow) {
      this.floatingWindow.hide();
    }
  }

  createTray(): void {
    this.tray = new Tray(this.trayIcons.idle);

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

    // Registrar hotkeys usando o novo HotkeyManager
    this.hotkeyManager.register(
      settings.hotkeys.startStop,
      settings.hotkeys.codeSnippet,
      settings.hotkeys.cancel
    );
  }

  setupHotkeyListeners(): void {
    // Listener para quando a hotkey é pressionada
    this.hotkeyManager.on('hotkey-pressed', async () => {
      const settings = this.openWisprApp.getSettings();
      const isRecording = this.openWisprApp.getRecordingState().isRecording;

      if (settings.hotkeys.startStop.mode === 'toggle') {
        // Modo toggle: alternar entre gravar e parar
        if (isRecording) {
          await this.openWisprApp.stopRecording();
        } else {
          await this.openWisprApp.startRecording();
        }
      } else {
        // Modo push-to-talk: iniciar gravação
        if (!isRecording) {
          await this.openWisprApp.startRecording();
        }
      }
    });

    // Listener para quando a hotkey é solta (apenas em push-to-talk)
    this.hotkeyManager.on('hotkey-released', async () => {
      const settings = this.openWisprApp.getSettings();
      const isRecording = this.openWisprApp.getRecordingState().isRecording;

      if (settings.hotkeys.startStop.mode === 'push-to-talk' && isRecording) {
        // Parar gravação quando soltar as teclas
        await this.openWisprApp.stopRecording();
      }
    });

    // Listener para cancelamento
    this.hotkeyManager.on('cancel-pressed', () => {
      if (this.openWisprApp.getRecordingState().isRecording) {
        console.log('⏹️ Gravação cancelada pelo usuário');
        // Implementar lógica de cancelamento se necessário
      }
    });

    // Listener para quando a hotkey de code snippet é pressionada
    this.hotkeyManager.on('code-snippet-hotkey-pressed', async () => {
      const settings = this.openWisprApp.getSettings();
      const isRecording = this.openWisprApp.getRecordingState().isRecording;

      if (settings.hotkeys.codeSnippet.mode === 'toggle') {
        // Modo toggle: alternar entre gravar e parar
        if (isRecording) {
          await this.handleCodeSnippetRecordingStop();
        } else {
          // Enable code snippet mode before starting recording
          this.openWisprApp.setCodeSnippetMode(true);
          await this.openWisprApp.startRecording();
        }
      } else {
        // Modo push-to-talk: iniciar gravação
        if (!isRecording) {
          // Enable code snippet mode before starting recording
          this.openWisprApp.setCodeSnippetMode(true);
          await this.openWisprApp.startRecording();
        }
      }
    });

    // Listener para quando a hotkey de code snippet é solta (apenas em push-to-talk)
    this.hotkeyManager.on('code-snippet-hotkey-released', async () => {
      const settings = this.openWisprApp.getSettings();
      const isRecording = this.openWisprApp.getRecordingState().isRecording;

      if (settings.hotkeys.codeSnippet.mode === 'push-to-talk' && isRecording) {
        // Parar gravação quando soltar as teclas
        await this.handleCodeSnippetRecordingStop();
      }
    });
  }

  private async handleCodeSnippetRecordingStop(): Promise<void> {
    // Import dependencies
    const { GroqCodeInterpreter } = await import('./groq-code-interpreter');
    const { TextInserter } = await import('./text-inserter');

    // Stop recording and get transcription
    await this.openWisprApp.stopRecording();

    // Wait for transcription to complete
    // We'll need to listen for the transcription-completed event
    // For now, we'll use a simple approach with a one-time listener
    const transcriptionPromise = new Promise<string>((resolve) => {
      const handler = (session: any) => {
        this.openWisprApp.off('transcription-completed', handler);
        resolve(session.transcription);
      };
      this.openWisprApp.once('transcription-completed', handler);
    });

    const transcription = await transcriptionPromise;
    console.log(`📝 Transcription for code snippet: "${transcription}"`);

    // Interpret the code using Groq
    const settings = this.openWisprApp.getSettings();
    const codeInterpreter = new GroqCodeInterpreter(settings.api.groqApiKey);

    if (!codeInterpreter.isConfigured()) {
      console.error('❌ Groq API key not configured');
      this.sendToRenderer('error', 'Groq API key not configured. Please set your API key in settings.');
      return;
    }

    try {
      const interpretedCode = await codeInterpreter.interpretCode(transcription);
      console.log(`💻 Interpreted code: "${interpretedCode}"`);

      // Insert the interpreted code instead of the raw transcription
      await TextInserter.insertText(interpretedCode, 'append', settings);

      // Notify the UI
      this.sendToRenderer('text-inserted', interpretedCode);
    } catch (error: any) {
      console.error('❌ Error interpreting code:', error);
      this.sendToRenderer('error', error.message || 'Error interpreting code');
    }
  }

  setupIpcHandlers(): void {
    // Handlers específicos do Electron App (não do OpenWisprApp)

    // Reregistrar hotkeys quando configurações de hotkey mudarem
    ipcMain.on('hotkeys-updated', () => {
      this.hotkeyManager.unregister();
      this.setupGlobalShortcuts();
    });

    // Floating window commands
    ipcMain.on('floating-command', async (_, command: string) => {
      switch (command) {
        case 'pause':
          // TODO: Implement pause functionality
          console.log('Pause command received');
          break;
        case 'stop':
          await this.openWisprApp.stopRecording();
          break;
      }
    });

    // Get recording state for floating window
    ipcMain.handle('get-floating-state', async () => {
      return this.openWisprApp.getRecordingState();
    });
  }

  setupOpenWisprListeners(): void {
    this.openWisprApp.on('recording-started', () => {
      this.sendToRenderer('recording-started');
      this.sendToFloatingWindow('recording-started');
      this.showFloatingWindow();
      this.updateTrayIcon('recording');
      this.updateTrayMenu();
    });

    this.openWisprApp.on('recording-stopped', () => {
      this.sendToRenderer('recording-stopped');
      this.sendToFloatingWindow('recording-stopped');
      // Keep floating window visible - don't hide it
      this.updateTrayIcon('idle');
      this.updateTrayMenu();
    });

    this.openWisprApp.on('processing-started', () => {
      this.sendToRenderer('processing-started');
      this.updateTrayIcon('processing');
    });

    this.openWisprApp.on('transcription-completed', (session) => {
      this.sendToRenderer('transcription-completed', session);
      this.updateTrayIcon('idle');

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

  sendToRenderer(event: string, data?: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(event, data);
    }
  }

  sendToFloatingWindow(event: string, data?: unknown): void {
    if (this.floatingWindow && !this.floatingWindow.isDestroyed()) {
      this.floatingWindow.webContents.send(event, data);
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
    this.hotkeyManager.destroy();
    globalShortcut.unregisterAll();
    this.openWisprApp.destroy();
    app.quit();
  }

  private getAppIcon(): NativeImage {
    // Return an empty icon or use the idle tray icon as the app icon
    return nativeImage.createEmpty();
  }

  private createTrayIcon(state: 'idle' | 'recording' | 'processing'): NativeImage {
    const iconFiles = {
      idle: 'blue_microphone.png',
      recording: 'red_microphone.png',
      processing: 'yellow_microphone.png',
    };

    // Try multiple possible paths for development and production
    const possiblePaths = [
      // Production mode - extraResource copies to resources/assets/ (since we specify 'src/assets')
      path.join(process.resourcesPath || '', 'assets', iconFiles[state]),
      // Production mode - alternative if extraResource keeps folder structure
      path.join(process.resourcesPath || '', 'src', 'assets', iconFiles[state]),
      // Development mode (Vite dev server)
      path.join(__dirname, '..', 'src', 'assets', iconFiles[state]),
      // Alternative production path
      path.join(__dirname, '..', 'assets', iconFiles[state]),
      // Direct path from project root
      path.join(app.getAppPath(), 'src', 'assets', iconFiles[state]),
      // Production mode - app.asar.unpacked
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'assets', iconFiles[state]),
    ];

    let icon: NativeImage | null = null;

    for (const iconPath of possiblePaths) {
      console.log(`Trying to load tray icon for state "${state}" from: ${iconPath}`);
      const testIcon = nativeImage.createFromPath(iconPath);

      if (!testIcon.isEmpty()) {
        console.log(`✓ Successfully loaded tray icon from: ${iconPath}`);
        icon = testIcon;
        break;
      }
    }

    if (!icon || icon.isEmpty()) {
      console.error(`❌ Failed to load tray icon for state "${state}" from any path`);
      console.error(`Tried paths:`, possiblePaths);
      // Return a fallback empty icon
      return nativeImage.createEmpty();
    }

    return icon;
  }

  private updateTrayIcon(state: 'idle' | 'recording' | 'processing'): void {
    if (!this.tray) return;

    const icon = this.trayIcons[state];
    this.tray.setImage(icon);

    // Update tooltip based on state
    const tooltips = {
      idle: 'OpenWispr - Pronto',
      recording: 'OpenWispr - Gravando...',
      processing: 'OpenWispr - Processando...'
    };

    this.tray.setToolTip(tooltips[state]);
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

  // Always show floating window on startup
  openWisprElectronApp.createFloatingWindow();
  openWisprElectronApp.showFloatingWindow();

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
