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
    // Settings
    ipcMain.handle('get-settings', () => {
      return this.voiceFlowApp.getSettings();
    });

    ipcMain.handle('update-settings', (_, category: keyof AppSettings, setting: any) => {
      this.voiceFlowApp.updateSettings(category, setting);
      
      // Reregistrar hotkeys se necessário
      if (category === 'hotkeys') {
        globalShortcut.unregisterAll();
        this.setupGlobalShortcuts();
      }
      
      return true;
    });

    // Recording
    ipcMain.handle('start-recording', async () => {
      await this.voiceFlowApp.startRecording();
    });

    ipcMain.handle('stop-recording', async () => {
      await this.voiceFlowApp.stopRecording();
    });

    ipcMain.handle('get-recording-state', () => {
      return this.voiceFlowApp.getRecordingState();
    });

    // History
    ipcMain.handle('get-history', () => {
      return this.voiceFlowApp.getTranscriptionHistory();
    });

    ipcMain.handle('clear-history', () => {
      this.voiceFlowApp.clearHistory();
    });

    // Text insertion
    ipcMain.handle('insert-text', async (_, text: string) => {
      await this.voiceFlowApp.insertTranscriptionText(text);
    });

    // Test API
    ipcMain.handle('test-api', async () => {
      return await this.voiceFlowApp.testApiConnection();
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
