import { EventEmitter } from 'events';
import { ITranscriptionProvider } from './transcription-provider';
import { TranscriptionFactory } from './transcription-factory';
import { TextInserter } from './text-inserter';
import { SettingsManager } from './settings-manager';
import { HistoryManager } from './history-manager';
import { TranscriptionSession, AppSettings, RecordingState } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { ipcMain, app } from 'electron';

export class DitossauroApp extends EventEmitter {
  private transcriptionProvider: ITranscriptionProvider;
  private settingsManager: SettingsManager;
  private historyManager: HistoryManager;
  private recordingState: RecordingState = { isRecording: false };
  private transcriptionHistory: TranscriptionSession[] = [];
  private mainWindow: Electron.BrowserWindow | null = null;
  private isCodeSnippetMode = false;

  constructor(mainWindow?: Electron.BrowserWindow) {
    super();

    this.mainWindow = mainWindow;
    this.settingsManager = new SettingsManager();
    this.historyManager = new HistoryManager();
    this.transcriptionHistory = this.historyManager.loadHistory();
    const settings = this.settingsManager.loadSettings();

    // Initialize transcription provider based on settings
    this.transcriptionProvider = this.createTranscriptionProvider(settings);

    this.setupEventListeners();
    this.setupAudioHandlers();
    this.setupIPCHandlers();
  }

  private createTranscriptionProvider(settings: AppSettings): ITranscriptionProvider {
    const providerType = settings.transcription.provider;

    switch (providerType) {
      case 'assemblyai':
        return TranscriptionFactory.createProvider('assemblyai', {
          apiKey: settings.api.assemblyAiKey
        });

      case 'faster-whisper':
        return TranscriptionFactory.createProvider('faster-whisper', {
          ...settings.transcription.fasterWhisper
        });

      case 'groq':
        return TranscriptionFactory.createProvider('groq', {
          apiKey: settings.api.groqApiKey,
          modelName: settings.transcription.groq.modelName,
          language: settings.transcription.groq.language
        });

      default:
        console.warn(`Unknown provider: ${providerType}, using Groq as default`);
        return TranscriptionFactory.createProvider('groq', {
          apiKey: settings.api.groqApiKey,
          modelName: settings.transcription.groq.modelName,
          language: settings.transcription.groq.language
        });
    }
  }

  private setupEventListeners(): void {
    // Event listeners are now handled via IPC
  }

  private setupAudioHandlers(): void {
    // Handler to process audio data from renderer
    ipcMain.handle('process-audio-data', async (_, audioData: number[], duration: number) => {
      try {
        return await this.processAudioData(audioData, duration);
      } catch (error) {
        console.error('Error processing audio:', error);
        throw error;
      }
    });

    // Handler for audio events
    ipcMain.on('audio-event', (_, eventType: string, data?: unknown) => {
      switch (eventType) {
        case 'recording-started':
          this.recordingState = { isRecording: true, startTime: new Date() };
          this.emit('recording-started');
          console.log('🎤 Recording started (Web Audio API)');
          break;
        case 'recording-stopped':
          this.recordingState = { isRecording: false };
          this.emit('recording-stopped', data);
          console.log('⏹️ Recording stopped');
          break;
        case 'error':
          this.emit('error', new Error(data as string));
          console.error('❌ Audio error:', data);
          break;
      }
    });
  }

  private async processAudioData(audioData: number[], duration: number): Promise<{ audioFile: string; duration: number }> {
    // Convert array back to Buffer
    const buffer = Buffer.from(audioData);

    console.log(`📦 Received audio data: ${buffer.length} bytes`);

    // Determine extension based on file header
    let extension = '.webm';
    let mimeType = 'audio/webm';

    // Check header to identify format
    if (buffer.length > 4) {
      const header = buffer.toString('hex', 0, 4);
      console.log(`🔍 File header: ${header}`);

      // WebM header starts with 0x1A45DFA3
      if (buffer[0] === 0x1A && buffer[1] === 0x45) {
        extension = '.webm';
        mimeType = 'audio/webm';
      }
      // WAV header "RIFF"
      else if (buffer.toString('ascii', 0, 4) === 'RIFF') {
        extension = '.wav';
        mimeType = 'audio/wav';
      }
      // MP4/M4A header
      else if (buffer.toString('ascii', 4, 8) === 'ftyp') {
        extension = '.m4a';
        mimeType = 'audio/mp4';
      }
    }

    // Save to temporary file with correct extension
    const tempFilePath = path.join(app.getPath('temp'), `temp_audio_${uuidv4()}${extension}`);
    await fs.promises.writeFile(tempFilePath, buffer);

    console.log(`💾 Audio saved: ${tempFilePath} (${buffer.length} bytes, ${mimeType})`);

    // Process transcription
    await this.processRecording({ audioFile: tempFilePath, duration });

    return { audioFile: tempFilePath, duration };
  }

  async startRecording(): Promise<void> {
    if (this.recordingState.isRecording) {
      console.log('⚠️ Already recording');
      return;
    }

    if (!this.transcriptionProvider.isConfigured()) {
      const providerName = this.transcriptionProvider.getProviderName();
      throw new Error(`${providerName} is not configured correctly`);
    }

    // Delegate to renderer process via Web Audio API
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        await this.mainWindow.webContents.executeJavaScript(`
          window.audioRecorder.startRecording()
        `);
      } catch (error) {
        console.error('Error starting recording:', error);
        throw new Error('Failed to start recording. Check microphone permissions.');
      }
    } else {
      throw new Error('Main window not available');
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recordingState.isRecording) {
      console.log('⚠️ Not recording');
      return;
    }

    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        await this.mainWindow.webContents.executeJavaScript(`
          window.audioRecorder.stopRecording()
        `);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.emit('error', error);
    }
  }

  private async processRecording(recordingData: { audioFile: string; duration: number }): Promise<void> {
    try {
      this.emit('processing-started');
      console.log('🔄 Processing transcription...');

      const settings = this.settingsManager.loadSettings();

      // Get language based on provider
      let language = settings.api.language; // Default fallback
      if (settings.transcription.provider === 'groq') {
        language = settings.transcription.groq.language;
      }

      const transcriptionResult = await this.transcriptionProvider.transcribeAudio(
        recordingData.audioFile,
        language
      );

      // Create transcription session
      const session: TranscriptionSession = {
        id: uuidv4(),
        timestamp: new Date(),
        transcription: transcriptionResult.text,
        duration: transcriptionResult.duration || recordingData.duration,
        language: transcriptionResult.language, // Use detected language from transcription
        confidence: transcriptionResult.confidence || 0.95
      };

      // Add to history
      this.transcriptionHistory.unshift(session);

      // Keep only last 50 transcriptions
      if (this.transcriptionHistory.length > 50) {
        this.transcriptionHistory = this.transcriptionHistory.slice(0, 50);
      }

      // Save history
      this.historyManager.saveHistory(this.transcriptionHistory);

      this.emit('transcription-completed', session);
      console.log('✅ Transcription completed:', transcriptionResult.text);

      // Insert text automatically if configured
      // But DO NOT insert if in code snippet mode (handled by main.ts)
      if (settings.behavior.autoInsert && transcriptionResult.text.trim() && !this.isCodeSnippetMode) {
        await this.insertTranscriptionText(transcriptionResult.text);
      }

      // Reset code snippet mode after processing
      this.isCodeSnippetMode = false;

      // Clean up temporary file
      this.cleanupTempFile(recordingData.audioFile);

    } catch (error) {
      console.error('Error processing recording:', error);
      this.emit('error', error);
    } finally {
      this.emit('processing-completed');
    }
  }

  async insertTranscriptionText(text: string): Promise<void> {
    try {
      console.log('📝 Inserting transcribed text...');
      const settings = this.settingsManager.loadSettings();
      await TextInserter.insertText(text, 'append', settings);
      this.emit('text-inserted', text);
    } catch (error) {
      console.error('Error inserting text:', error);
      this.emit('error', error);
    }
  }

  getRecordingState(): RecordingState {
    return { ...this.recordingState };
  }

  getTranscriptionHistory(): TranscriptionSession[] {
    return [...this.transcriptionHistory];
  }

  getSettings(): AppSettings {
    return this.settingsManager.loadSettings();
  }

  setCodeSnippetMode(enabled: boolean): void {
    this.isCodeSnippetMode = enabled;
    console.log(`🔧 Code snippet mode: ${enabled ? 'enabled' : 'disabled'}`);
  }

  isInCodeSnippetMode(): boolean {
    return this.isCodeSnippetMode;
  }

  updateSettings(category: keyof AppSettings, setting: Record<string, unknown>): void {
    this.settingsManager.updateSetting(category, setting);

    // Reload settings in necessary components
    const newSettings = this.settingsManager.loadSettings();

    if (category === 'api' || category === 'transcription') {
      // Recreate the transcription provider if settings changed
      this.transcriptionProvider = this.createTranscriptionProvider(newSettings);
    }

    if (category === 'audio') {
      // Audio settings will be applied on next recording
      console.log('Audio settings updated');
    }

    this.emit('settings-updated', newSettings);
  }

  clearHistory(): void {
    this.transcriptionHistory = [];
    this.historyManager.clearHistory();
    this.emit('history-cleared');
    console.log('🗑️ Transcription history cleared');
  }

  async testApiConnection(): Promise<boolean> {
    try {
      const providerName = this.transcriptionProvider.getProviderName();
      console.log(`🧪 Testing connection to ${providerName}...`);
      return await this.transcriptionProvider.testConnection();
    } catch (error) {
      console.error('❌ Error testing connection:', error);
      return false;
    }
  }

  setMainWindow(mainWindow: Electron.BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  destroy(): void {
    if (this.recordingState.isRecording) {
      this.stopRecording().catch(console.error);
    }
    this.removeAllListeners();
  }

  private setupIPCHandlers(): void {
    // Settings
    ipcMain.handle('get-settings', () => {
      return this.settingsManager.loadSettings();
    });

    ipcMain.handle('update-settings', (_, category: keyof AppSettings, setting: Record<string, unknown>) => {
      this.updateSettings(category, setting);

      // Notify main process if hotkeys were updated
      if (category === 'hotkeys') {
        // Emit event for the main process to reregister hotkeys
        process.nextTick(() => {
          ipcMain.emit('hotkeys-updated');
        });
      }

      return true;
    });

    // Recording
    ipcMain.handle('start-recording', async () => {
      await this.startRecording();
    });

    ipcMain.handle('stop-recording', async () => {
      await this.stopRecording();
    });

    ipcMain.handle('get-recording-state', () => {
      return this.getRecordingState();
    });

    // History
    ipcMain.handle('get-history', () => {
      return this.getTranscriptionHistory();
    });

    ipcMain.handle('clear-history', () => {
      this.clearHistory();
    });

    // Text insertion
    ipcMain.handle('insert-text', async (_, text: string) => {
      await this.insertTranscriptionText(text);
    });

    // Test API
    ipcMain.handle('test-api', async () => {
      return await this.testApiConnection();
    });

    // Transcription providers
    ipcMain.handle('get-available-providers', () => {
      return TranscriptionFactory.getAvailableProviders();
    });

    ipcMain.handle('get-current-provider', () => {
      return {
        name: this.transcriptionProvider.getProviderName(),
        isConfigured: this.transcriptionProvider.isConfigured()
      };
    });

    ipcMain.handle('get-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('get-author', () => {
      // Use app.getAppPath() to get the correct base path
      const appPath = app.getAppPath();
      const possiblePaths = [
        path.join(appPath, 'package.json'),           // Production (inside asar)
        path.join(appPath, '..', 'package.json'),     // Development (from .vite/build)
        path.join(appPath, '..', '..', 'package.json'), // Alternate dev structure
      ];

      for (const packagePath of possiblePaths) {
        try {
          if (fs.existsSync(packagePath)) {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            // Handle both string and object author format
            if (typeof packageJson.author === 'string') {
              return packageJson.author;
            } else if (packageJson.author && typeof packageJson.author === 'object') {
              return packageJson.author.name || 'Unknown';
            }
          }
        } catch (error) {
          // Continue to next path
          continue;
        }
      }

      console.error('Error reading package.json from any location');
      return 'Unknown';
    });

    ipcMain.handle('get-app-icon-path', () => {
      const iconName = 'app_icon.png';
      const appPath = app.getAppPath();

      const possiblePaths = [
        // Development mode (from .vite/build)
        path.join(appPath, '..', '..', 'src', 'assets', iconName),
        path.join(appPath, '../src/assets', iconName),
        // Production mode - extraResource copies to resources/assets/
        path.join(process.resourcesPath || '', 'assets', iconName),
        path.join(process.resourcesPath || '', 'src', 'assets', iconName),
        // If packed in asar.unpacked
        path.join(process.resourcesPath || '', 'app.asar.unpacked', 'assets', iconName),
        // Alternate locations
        path.join(appPath, 'assets', iconName),
        path.join(__dirname, '..', '..', 'src', 'assets', iconName),
      ];

      for (const iconPath of possiblePaths) {
        if (fs.existsSync(iconPath)) {
          console.log(`Found app icon at: ${iconPath}`);
          try {
            // Read the file and convert to base64 data URL
            const imageBuffer = fs.readFileSync(iconPath);
            const base64Image = imageBuffer.toString('base64');
            return `data:image/png;base64,${base64Image}`;
          } catch (error) {
            console.error('Error reading app icon:', error);
            return '';
          }
        }
      }

      console.error('App icon not found in any expected location');
      console.log('App path:', appPath);
      console.log('__dirname:', __dirname);
      console.log('Searched paths:', possiblePaths);
      return '';
    });
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Arquivo temporário removido:', filePath);
      }
    } catch (err) {
      console.error('Erro ao remover arquivo temporário:', err);
    }
  }
}
