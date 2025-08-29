import { app, BrowserWindow, ipcMain, globalShortcut, shell, screen } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import Store from 'electron-store';
import axios from 'axios';

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

interface AppConfig {
  hotkey: string;
  modelSize: string;
  language: string | null;
  autoLanguageDetection: boolean;
  overlayEnabled: boolean;
  overlayPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class OpenWisprMain {
  private mainWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private backendProcess: ChildProcess | null = null;
  private store: Store<AppConfig>;
  private backendUrl = 'http://127.0.0.1:5000';
  private isDev = process.env.NODE_ENV === 'development';

  constructor() {
    // Initialize configuration store
    this.store = new Store({
      defaults: {
        hotkey: 'CommandOrControl+Space',
        modelSize: 'base',
        language: null,
        autoLanguageDetection: true,
        overlayEnabled: true,
        overlayPosition: 'top-right'
      }
    });

    this.setupApp();
  }

  private setupApp() {
    // Handle app ready
    app.whenReady().then(() => {
      this.createMainWindow();
      this.createOverlayWindow();
      this.startBackend();
      this.setupIPC();
      this.setupGlobalShortcuts();
    });

    // Handle window closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.cleanup();
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    // Cleanup on app quit
    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, '..', 'assets', 'icon.png'),
      show: false // Hide initially, show when ready
    });

    // Load the app
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createOverlayWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    this.overlayWindow = new BrowserWindow({
      width: 200,
      height: 80,
      x: width - 220,
      y: 20,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false
    });

    // Load overlay HTML
    if (this.isDev) {
      this.overlayWindow.loadURL('http://localhost:3000#overlay');
    } else {
      this.overlayWindow.loadFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'), {
        hash: 'overlay'
      });
    }

    // Make overlay click-through when not active
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  private async startBackend() {
    try {
      const backendPath = path.join(__dirname, '..', 'backend', 'main.py');
      
      this.backendProcess = spawn('python', [backendPath], {
        cwd: path.join(__dirname, '..', 'backend'),
        stdio: 'pipe'
      });

      this.backendProcess.stdout?.on('data', (data) => {
        console.log(`Backend stdout: ${data}`);
      });

      this.backendProcess.stderr?.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
      });

      this.backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
      });

      // Wait for backend to be ready
      await this.waitForBackend();
      console.log('Backend started successfully');

    } catch (error) {
      console.error('Failed to start backend:', error);
    }
  }

  private async waitForBackend(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(`${this.backendUrl}/health`);
        return; // Backend is ready
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Backend failed to start within timeout');
  }

  private setupIPC() {
    // Get configuration
    ipcMain.handle('get-config', () => {
      return this.store.store;
    });

    // Update configuration
    ipcMain.handle('update-config', async (event, newConfig: Partial<AppConfig>) => {
      // Update local store
      Object.keys(newConfig).forEach(key => {
        this.store.set(key as keyof AppConfig, (newConfig as any)[key]);
      });

      // Update backend configuration
      try {
        await axios.post(`${this.backendUrl}/config`, {
          hotkey: this.store.get('hotkey'),
          model_size: this.store.get('modelSize'),
          language: this.store.get('language'),
          auto_language_detection: this.store.get('autoLanguageDetection')
        });
      } catch (error) {
        console.error('Failed to update backend config:', error);
      }

      // Update global shortcuts if hotkey changed
      if (newConfig.hotkey) {
        this.setupGlobalShortcuts();
      }

      return this.store.store;
    });

    // Backend API proxy
    ipcMain.handle('backend-request', async (event, method: string, endpoint: string, data?: any) => {
      try {
        const response = await axios({
          method,
          url: `${this.backendUrl}${endpoint}`,
          data
        });
        return response.data;
      } catch (error: any) {
        console.error(`Backend request failed: ${error.message}`);
        throw error;
      }
    });

    // Show/hide overlay
    ipcMain.handle('show-overlay', () => {
      if (this.store.get('overlayEnabled')) {
        this.overlayWindow?.show();
      }
    });

    ipcMain.handle('hide-overlay', () => {
      this.overlayWindow?.hide();
    });

    // Update overlay status
    ipcMain.handle('update-overlay', (event, status: 'ready' | 'listening' | 'processing') => {
      this.overlayWindow?.webContents.send('status-update', status);
    });

    // Open external links
    ipcMain.handle('open-external', (event, url: string) => {
      shell.openExternal(url);
    });

    // Minimize to tray
    ipcMain.handle('minimize-to-tray', () => {
      this.mainWindow?.hide();
    });

    // Show main window
    ipcMain.handle('show-main-window', () => {
      this.mainWindow?.show();
      this.mainWindow?.focus();
    });
  }

  private setupGlobalShortcuts() {
    // Clear existing shortcuts
    globalShortcut.unregisterAll();

    // Register hotkey for voice recording
    const hotkey = this.store.get('hotkey');
    
    try {
      globalShortcut.register(hotkey, async () => {
        console.log('Global hotkey triggered');
        
        try {
          // Show overlay
          if (this.store.get('overlayEnabled')) {
            this.overlayWindow?.show();
            this.overlayWindow?.webContents.send('status-update', 'listening');
          }

          // Start recording
          await axios.post(`${this.backendUrl}/start-recording`);

        } catch (error) {
          console.error('Failed to start recording:', error);
          this.overlayWindow?.webContents.send('status-update', 'ready');
        }
      });

      console.log(`Global shortcut registered: ${hotkey}`);

    } catch (error) {
      console.error('Failed to register global shortcut:', error);
    }

    // Register hotkey release (this is tricky with Electron's globalShortcut)
    // In a production app, you'd use a more sophisticated hotkey library
    // For now, we'll rely on the backend's hotkey handling
  }

  private cleanup() {
    // Unregister shortcuts
    globalShortcut.unregisterAll();

    // Close backend process
    if (this.backendProcess && !this.backendProcess.killed) {
      this.backendProcess.kill('SIGTERM');
    }

    // Close windows
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.close();
    }
    
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }
}

// Create the main application instance
new OpenWisprMain();