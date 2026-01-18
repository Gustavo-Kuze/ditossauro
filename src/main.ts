import { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, Notification, NativeImage, screen } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dotenv from 'dotenv';
import { DitossauroApp } from './ditossauro-app';
import { HotkeyManager } from './hotkey-manager';
import { i18nMain } from './i18n-main';

dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

class DitossauroElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private floatingWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private ditossauroApp: DitossauroApp;
  private hotkeyManager: HotkeyManager;
  private isQuitting = false;
  private hasShownTrayNotification = false;
  private isProcessingCodeSnippet = false;
  private trayIcons: {
    idle: NativeImage;
    recording: NativeImage;
    processing: NativeImage;
  };

  constructor() {
    // Init DitossauroApp for registering IPC handlers
    this.ditossauroApp = new DitossauroApp();
    this.hotkeyManager = new HotkeyManager();

    // Set App User Model ID for Windows taskbar icon
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.ditossauro.app');
    }

    // Initialize i18n
    const settings = this.ditossauroApp.getSettings();
    i18nMain.init(settings.locale || 'pt-BR');

    // Create tray icons
    this.trayIcons = {
      idle: this.createTrayIcon('idle'),
      recording: this.createTrayIcon('recording'),
      processing: this.createTrayIcon('processing'),
    };

    this.setupDitossauroListeners();
    this.setupHotkeyListeners();
  }

  createWindow(): void {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 700,
      minWidth: 600,
      minHeight: 500,
      show: false, // Don't show initially
      icon: this.getAppIcon(),
      autoHideMenuBar: true, // Hide menu bar
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

        // Show notification informing that the app continues running (only once per session)
        if (Notification.isSupported() && !this.hasShownTrayNotification) {
          new Notification({
            title: 'Ditossauro',
            body: i18nMain.t('notifications.minimizedToTray'),
          }).show();
          this.hasShownTrayNotification = true;
        }
      }
    });

    this.mainWindow.on('ready-to-show', () => {
      // Update window reference in DitossauroApp
      this.ditossauroApp.setMainWindow(this.mainWindow);

      // Inject Web Audio Recorder
      this.injectWebAudioRecorder();

      // Show only if not to start minimized
      const settings = this.ditossauroApp.getSettings();
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
      // Window already exists, do nothing
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
      // Don't auto-show here - let the caller decide based on settings
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
        label: 'Ditossauro',
        type: 'normal',
        enabled: false,
      },
      {
        type: 'separator',
      },
      {
        label: i18nMain.t('tray.openInterface'),
        type: 'normal',
        click: () => this.showWindow(),
      },
      {
        label: i18nMain.t('tray.status'),
        type: 'submenu',
        submenu: [
          {
            label: this.ditossauroApp.getRecordingState().isRecording ? '🎤 ' + i18nMain.t('tray.recording') : '⏹️ ' + i18nMain.t('tray.stopped'),
            enabled: false,
          },
          {
            type: 'separator',
          },
          {
            label: i18nMain.t('tray.startRecording'),
            click: () => this.ditossauroApp.startRecording().catch(console.error),
            enabled: !this.ditossauroApp.getRecordingState().isRecording,
          },
          {
            label: i18nMain.t('tray.stopRecording'),
            click: () => this.ditossauroApp.stopRecording().catch(console.error),
            enabled: this.ditossauroApp.getRecordingState().isRecording,
          },
        ],
      },
      {
        type: 'separator',
      },
      {
        label: i18nMain.t('tray.settings'),
        type: 'normal',
        click: () => this.showWindow('settings'),
      },
      {
        label: i18nMain.t('tray.history'),
        type: 'normal',
        click: () => this.showWindow('history'),
      },
      {
        type: 'separator',
      },
      {
        label: i18nMain.t('tray.quit'),
        type: 'normal',
        click: () => this.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('Ditossauro - ' + i18nMain.t('app.description'));

    this.tray.on('click', () => {
      this.showWindow();
    });
  }

  setupGlobalShortcuts(): void {
    const settings = this.ditossauroApp.getSettings();

    // Register hotkeys using the new HotkeyManager
    this.hotkeyManager.register(
      settings.hotkeys.startStop,
      settings.hotkeys.codeSnippet,
      settings.hotkeys.cancel
    );
  }

  setupHotkeyListeners(): void {
    // Listener for when the hotkey is pressed
    this.hotkeyManager.on('hotkey-pressed', async () => {
      const settings = this.ditossauroApp.getSettings();
      const isRecording = this.ditossauroApp.getRecordingState().isRecording;

      if (settings.hotkeys.startStop.mode === 'toggle') {
        // Toggle mode: alternate between record and stop
        if (isRecording) {
          await this.ditossauroApp.stopRecording();
        } else {
          await this.ditossauroApp.startRecording();
        }
      } else {
        // Push-to-talk mode: start recording
        if (!isRecording) {
          await this.ditossauroApp.startRecording();
        }
      }
    });

    // Listener for when the hotkey is released (only in push-to-talk)
    this.hotkeyManager.on('hotkey-released', async () => {
      const settings = this.ditossauroApp.getSettings();
      const isRecording = this.ditossauroApp.getRecordingState().isRecording;

      if (settings.hotkeys.startStop.mode === 'push-to-talk' && isRecording) {
        console.log('⏹️ Stopping recording (hotkey released)');
        try {
          await this.ditossauroApp.stopRecording();
        } catch (error) {
          console.error('Error stopping recording on hotkey release:', error);
        }
      }
    });

    // Listener for cancellation
    this.hotkeyManager.on('cancel-pressed', () => {
      if (this.ditossauroApp.getRecordingState().isRecording) {
        console.log('⏹️ Recording canceled by user');
        // Implement cancellation logic if needed
      }
    });

    // Listener for when the code snippet hotkey is pressed
    this.hotkeyManager.on('code-snippet-hotkey-pressed', async () => {
      const settings = this.ditossauroApp.getSettings();
      const isRecording = this.ditossauroApp.getRecordingState().isRecording;

      if (settings.hotkeys.codeSnippet.mode === 'toggle') {
        // Toggle mode: alternate between record and stop
        if (isRecording) {
          await this.handleCodeSnippetRecordingStop();
        } else {
          // Enable code snippet mode before starting recording
          this.ditossauroApp.setCodeSnippetMode(true);
          await this.ditossauroApp.startRecording();
        }
      } else {
        // Modo push-to-talk: iniciar gravação
        if (!isRecording) {
          // Enable code snippet mode before starting recording
          this.ditossauroApp.setCodeSnippetMode(true);
          await this.ditossauroApp.startRecording();
        }
      }
    });

    // Listener for when the code snippet hotkey is released (only in push-to-talk)
    this.hotkeyManager.on('code-snippet-hotkey-released', async () => {
      const settings = this.ditossauroApp.getSettings();
      const isRecording = this.ditossauroApp.getRecordingState().isRecording;

      if (settings.hotkeys.codeSnippet.mode === 'push-to-talk' && isRecording) {
        console.log('⏹️ Stopping code snippet recording (hotkey released)');
        await this.handleCodeSnippetRecordingStop();
      }
    });
  }

  private async handleCodeSnippetRecordingStop(): Promise<void> {
    console.log('🎬 handleCodeSnippetRecordingStop() called');

    // Prevent duplicate processing
    if (this.isProcessingCodeSnippet) {
      console.log('⚠️ Already processing code snippet, ignoring duplicate call');
      return;
    }

    this.isProcessingCodeSnippet = true;
    console.log('✅ isProcessingCodeSnippet set to true');

    try {
      console.log('📦 Importing dependencies...');
      // Import dependencies
      const { VoiceCommandDetector } = await import('./voice-command-detector');
      const { CodeInterpreterFactory } = await import('./code-interpreter-factory');
      const { TextInserter } = await import('./text-inserter');
      console.log('✅ Dependencies imported successfully');

      console.log('📋 Setting up transcription listener for code snippet mode...');

      // Set up listener BEFORE stopping recording to avoid race condition
      const transcriptionPromise = new Promise<import('./types').TranscriptionSession>((resolve) => {
        const handler = (completedSession: import('./types').TranscriptionSession) => {
          console.log('📨 Received transcription-completed event in code snippet mode');
          this.ditossauroApp.off('transcription-completed', handler);
          resolve(completedSession);
        };
        this.ditossauroApp.once('transcription-completed', handler);
      });

      // Stop recording if still recording (in case called from toggle mode)
      // In push-to-talk mode, recording is already stopped by the hotkey release
      const isRecording = this.ditossauroApp.getRecordingState().isRecording;
      if (isRecording) {
        console.log('⏸️ Stopping recording for code snippet mode...');
        try {
          await this.ditossauroApp.stopRecording();
        } catch (error) {
          console.error('Error stopping recording:', error);
          // Continue anyway - transcription might already be in progress
        }
      } else {
        console.log('ℹ️ Recording already stopped, waiting for transcription...');
      }

      // Wait for transcription to complete
      console.log('⏳ Waiting for transcription to complete...');
      const session = await transcriptionPromise;
      console.log('✅ Transcription promise resolved');

      const transcription = session.transcription;
      console.log(`📝 Transcription for code snippet: "${transcription}"`);

      // Get settings
      const settings = this.ditossauroApp.getSettings();

      // Map detected language to locale (e.g., "pt"/"Portuguese" -> "pt-BR", "en"/"English" -> "en")
      const detectedLanguage = session.language || 'en';
      console.log(`🌐 Detected language from session: "${detectedLanguage}"`);

      // Normalize language - Groq returns full names like "Portuguese", "English"
      const normalizedLanguage = detectedLanguage.toLowerCase();
      let locale: string;

      if (normalizedLanguage === 'pt' || normalizedLanguage === 'portuguese') {
        locale = 'pt-BR';
      } else if (normalizedLanguage === 'en' || normalizedLanguage === 'english') {
        locale = 'en';
      } else {
        locale = settings.locale || 'en';
      }

      console.log(`🗺️ Mapped to locale: "${locale}"`);

      // Detect voice command
      const commandResult = VoiceCommandDetector.detectCommand(transcription, locale);
      console.log(`🎯 Detected language: ${commandResult.language}, stripped: "${commandResult.strippedTranscription}"`);

      // Handle hotkeys command separately (no API key needed, no text insertion)
      if (commandResult.language === 'hotkeys') {
        try {
          const hotkeyInterpreter = CodeInterpreterFactory.createInterpreter(
            'hotkeys',
            settings.api.groqApiKey
          );
          const result = await hotkeyInterpreter.interpretCode(
            commandResult.strippedTranscription
          );
          console.log(`🎹 Hotkeys sent: ${result}`);
          // Don't insert text for hotkeys commands
          this.sendToRenderer('text-inserted', result);
        } catch (error: any) {
          console.error('❌ Error sending hotkeys:', error);
          const errorMsg = error.message || 'Error sending hotkeys';
          this.sendToRenderer('error', errorMsg);
          // Log the error but don't let it crash the app
          console.log('âś… App state recovered after hotkey error');
        }
        // Always return to reset state properly
        return;
      }

      // Create appropriate interpreter based on detected language
      const codeInterpreter = CodeInterpreterFactory.createInterpreter(
        commandResult.language,
        settings.api.groqApiKey
      );

      if (!codeInterpreter.isConfigured()) {
        console.error('❌ Groq API key not configured');
        this.sendToRenderer('error', i18nMain.t('notifications.groqNotConfigured'));
        return;
      }

      try {
        // Use stripped transcription (without command prefix)
        const interpretedCode = await codeInterpreter.interpretCode(
          commandResult.strippedTranscription
        );
        console.log(`💻 Interpreted ${commandResult.language} code: "${interpretedCode}"`);

        // Insert the interpreted code instead of the raw transcription
        await TextInserter.insertText(interpretedCode, 'append', settings);

        // Notify the UI
        this.sendToRenderer('text-inserted', interpretedCode);
      } catch (error: any) {
        console.error('❌ Error interpreting code:', error);
        this.sendToRenderer('error', error.message || 'Error interpreting code');
      }
    } catch (error: any) {
      console.error('❌ FATAL ERROR in handleCodeSnippetRecordingStop:', error);
      console.error('Stack trace:', error.stack);
      this.sendToRenderer('error', error.message || 'Error processing code snippet');
    } finally {
      // Reset the processing flag
      console.log('🔄 Resetting isProcessingCodeSnippet flag');
      this.isProcessingCodeSnippet = false;
    }
  }

  setupIpcHandlers(): void {
    // Electron App specific handlers (not DitossauroApp)

    // Reregister hotkeys when hotkey settings change
    ipcMain.on('hotkeys-updated', () => {
      this.hotkeyManager.unregister();
      this.setupGlobalShortcuts();
    });

    // Handle behavior settings changes (e.g., show/hide floating window)
    ipcMain.on('behavior-updated', () => {
      const settings = this.ditossauroApp.getSettings();
      if (settings.behavior?.showFloatingWindow) {
        this.showFloatingWindow();
      } else {
        this.hideFloatingWindow();
      }
    });

    // Floating window commands
    ipcMain.on('floating-command', async (_, command: string) => {
      switch (command) {
        case 'pause':
          // TODO: Implement pause functionality
          console.log('Pause command received');
          break;
        case 'stop':
          await this.ditossauroApp.stopRecording();
          break;
      }
    });

    // Get recording state for floating window
    ipcMain.handle('get-floating-state', async () => {
      return this.ditossauroApp.getRecordingState();
    });
  }

  setupDitossauroListeners(): void {
    this.ditossauroApp.on('recording-started', () => {
      this.sendToRenderer('recording-started');
      this.sendToFloatingWindow('recording-started');

      // Only show floating window if the setting allows it
      const settings = this.ditossauroApp.getSettings();
      if (settings.behavior?.showFloatingWindow !== false) {
        this.showFloatingWindow();
      }

      this.updateTrayIcon('recording');
      this.updateTrayMenu();
    });

    this.ditossauroApp.on('recording-stopped', () => {
      this.sendToRenderer('recording-stopped');
      this.sendToFloatingWindow('recording-stopped');
      // Keep floating window visible - don't hide it
      this.updateTrayIcon('idle');
      this.updateTrayMenu();
    });

    this.ditossauroApp.on('processing-started', () => {
      this.sendToRenderer('processing-started');
      this.updateTrayIcon('processing');
    });

    this.ditossauroApp.on('transcription-completed', (session) => {
      this.sendToRenderer('transcription-completed', session);
      this.updateTrayIcon('idle');

      if (Notification.isSupported()) {
        new Notification({
          title: i18nMain.t('notifications.transcriptionCompleted'),
          body: session.transcription.substring(0, 100) + '...',
        }).show();
      }
    });

    this.ditossauroApp.on('text-inserted', (text) => {
      this.sendToRenderer('text-inserted', text);
    });

    this.ditossauroApp.on('settings-updated', (settings) => {
      if (settings.locale) {
        i18nMain.setLocale(settings.locale);
        this.updateTrayMenu();
      }
    });

    this.ditossauroApp.on('error', (error) => {
      console.error('Ditossauro Error:', error);
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

    // Recreate the menu instead of trying to update the existing one
    const isRecording = this.ditossauroApp.getRecordingState().isRecording;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Ditossauro',
        type: 'normal',
        enabled: false,
      },
      {
        type: 'separator',
      },
      {
        label: i18nMain.t('tray.openInterface'),
        type: 'normal',
        click: () => this.showWindow(),
      },
      {
        label: i18nMain.t('tray.status'),
        type: 'submenu',
        submenu: [
          {
            label: isRecording ? '🎤 ' + i18nMain.t('tray.recording') : '⏹️ ' + i18nMain.t('tray.stopped'),
            enabled: false,
          },
          {
            type: 'separator',
          },
          {
            label: i18nMain.t('tray.startRecording'),
            click: () => this.ditossauroApp.startRecording().catch(console.error),
            enabled: !isRecording,
          },
          {
            label: i18nMain.t('tray.stopRecording'),
            click: () => this.ditossauroApp.stopRecording().catch(console.error),
            enabled: isRecording,
          },
        ],
      },
      {
        type: 'separator',
      },
      {
        label: i18nMain.t('tray.settings'),
        type: 'normal',
        click: () => this.showWindow('settings'),
      },
      {
        label: i18nMain.t('tray.history'),
        type: 'normal',
        click: () => this.showWindow('history'),
      },
      {
        type: 'separator',
      },
      {
        label: i18nMain.t('tray.quit'),
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
    this.ditossauroApp.destroy();
    app.quit();
  }

  private getAppIcon(): NativeImage {
    const iconName = 'app_icon.png';
    // Reuse the same logic as createTrayIcon for path resolution
    const possiblePaths = [
      // Production mode - extraResource copies to resources/assets/
      path.join(process.resourcesPath || '', 'assets', iconName),
      // Production mode - alternative
      path.join(process.resourcesPath || '', 'src', 'assets', iconName),
      // Development mode (Vite dev server)
      path.join(__dirname, '..', 'src', 'assets', iconName),
      // Alternative production path
      path.join(__dirname, '..', 'assets', iconName),
      // Direct path from project root
      path.join(app.getAppPath(), 'src', 'assets', iconName),
      // Production mode - app.asar.unpacked
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'assets', iconName),
    ];

    for (const iconPath of possiblePaths) {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        console.log(`✓ Loaded app icon from: ${iconPath}`);
        return icon;
      }
    }

    console.warn('⚠️ Could not load app icon, using default');
    return nativeImage.createEmpty();
  }

  private createTrayIcon(state: 'idle' | 'recording' | 'processing'): NativeImage {
    const iconFiles = {
      idle: 'default_tray_icon.png',
      recording: 'recording_tray_icon.png',
      processing: 'processing_tray_icon.png',
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
      idle: i18nMain.t('tray.tooltip.idle'),
      recording: i18nMain.t('tray.tooltip.recording'),
      processing: i18nMain.t('tray.tooltip.processing')
    };

    this.tray.setToolTip(tooltips[state]);
  }

  private injectWebAudioRecorder(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    // Inject Web Audio Recorder into renderer process
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
            console.log('Already recording...');
            return;
          }

          try {
            console.log('🎤 Starting recording with Web Audio API...');
            
            this.stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            });

            // Try different formats in order of preference
            let options = {};
            
            if (MediaRecorder.isTypeSupported('audio/wav')) {
              options = { mimeType: 'audio/wav' };
              console.log('📻 Using format: audio/wav');
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
              options = { mimeType: 'audio/webm;codecs=opus' };
              console.log('📻 Using format: audio/webm;codecs=opus');
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
              options = { mimeType: 'audio/webm' };
              console.log('📻 Using format: audio/webm');
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
              options = { mimeType: 'audio/mp4' };
              console.log('📻 Using format: audio/mp4');
            } else {
              console.log('📻 Using browser default format');
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
            
            // Notify the main process
            window.electronAPI.sendAudioEvent('recording-started');
            
            return true;
          } catch (error) {
            this.isRecording = false;
            let errorMessage = 'Error accessing microphone';
            if (error.name === 'NotAllowedError') {
              errorMessage = 'Permission denied to access microphone. Enable microphone access in browser settings.';
            } else if (error.name === 'NotFoundError') {
              errorMessage = 'No microphone found on the system';
            } else if (error.name === 'NotReadableError') {
              errorMessage = 'Microphone is being used by another application';
            }
            window.electronAPI.sendAudioEvent('error', errorMessage);
            throw new Error(errorMessage);
          }
        }

        async stopRecording() {
          if (!this.isRecording || !this.mediaRecorder) {
            throw new Error('Not recording');
          }

          return new Promise((resolve, reject) => {
            const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
            
            this.mediaRecorder.onstop = async () => {
              try {
                if (this.audioChunks.length === 0) {
                  throw new Error('No audio was recorded');
                }

                // Get the MIME type of the first chunk
                const mimeType = this.audioChunks[0]?.type || 'audio/webm';
                console.log(\`🎵 Detected MIME type: \${mimeType}\`);
                
                const audioBlob = new Blob(this.audioChunks, { type: mimeType });
                
                // Verificar se o blob tem conteúdo
                if (audioBlob.size === 0) {
                  throw new Error('Audio file empty');
                }
                
                const arrayBuffer = await audioBlob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                console.log(\`📦 Audio captured: \${uint8Array.length} bytes, \${duration.toFixed(1)}s, type: \${mimeType}\`);
                
                // Log the first bytes for debug
                const firstBytes = Array.from(uint8Array.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
                console.log(\`🔍 First bytes: \${firstBytes}\`);
                
                // Send data to the main process
                const result = await window.electronAPI.processAudioData(Array.from(uint8Array), duration);
                resolve(result);
              } catch (error) {
                console.error('Error processing audio:', error);
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
            console.error('Error listing devices:', error);
            return [];
          }
        }
      }

      // Make globally available
      window.audioRecorder = new WebAudioRecorderRenderer();
      console.log('✅ WebAudioRecorder injected successfully');
    `).catch(console.error);
  }
}

// Inicializar aplicação
const ditossauroElectronApp = new DitossauroElectronApp();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  ditossauroElectronApp.createWindow();
  ditossauroElectronApp.createTray();
  ditossauroElectronApp.setupGlobalShortcuts();
  ditossauroElectronApp.setupIpcHandlers();

  // Create floating window and show it based on settings
  ditossauroElectronApp.createFloatingWindow();
  const settings = ditossauroElectronApp.ditossauroApp.getSettings();
  if (settings.behavior?.showFloatingWindow !== false) {
    ditossauroElectronApp.showFloatingWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      ditossauroElectronApp.createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    ditossauroElectronApp.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
