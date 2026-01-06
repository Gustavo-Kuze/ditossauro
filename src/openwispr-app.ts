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

export class OpenWisprApp extends EventEmitter {
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

    // Inicializar o provedor de transcrição baseado nas configurações
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
        console.warn(`Provedor desconhecido: ${providerType}, usando Groq como padrão`);
        return TranscriptionFactory.createProvider('groq', {
          apiKey: settings.api.groqApiKey,
          modelName: settings.transcription.groq.modelName,
          language: settings.transcription.groq.language
        });
    }
  }

  private setupEventListeners(): void {
    // Os event listeners agora são tratados via IPC
  }

  private setupAudioHandlers(): void {
    // Handler para processar dados de áudio do renderer
    ipcMain.handle('process-audio-data', async (_, audioData: number[], duration: number) => {
      try {
        return await this.processAudioData(audioData, duration);
      } catch (error) {
        console.error('Erro ao processar áudio:', error);
        throw error;
      }
    });

    // Handler para eventos de áudio
    ipcMain.on('audio-event', (_, eventType: string, data?: unknown) => {
      switch (eventType) {
        case 'recording-started':
          this.recordingState = { isRecording: true, startTime: new Date() };
          this.emit('recording-started');
          console.log('🎤 Gravação iniciada (Web Audio API)');
          break;
        case 'recording-stopped':
          this.recordingState = { isRecording: false };
          this.emit('recording-stopped', data);
          console.log('⏹️ Gravação parada');
          break;
        case 'error':
          this.emit('error', new Error(data as string));
          console.error('❌ Erro de áudio:', data);
          break;
      }
    });
  }

  private async processAudioData(audioData: number[], duration: number): Promise<{ audioFile: string; duration: number }> {
    // Converter array de volta para Buffer
    const buffer = Buffer.from(audioData);

    console.log(`📦 Dados de áudio recebidos: ${buffer.length} bytes`);

    // Determinar extensão baseada no cabeçalho do arquivo
    let extension = '.webm';
    let mimeType = 'audio/webm';

    // Verificar o cabeçalho para identificar o formato
    if (buffer.length > 4) {
      const header = buffer.toString('hex', 0, 4);
      console.log(`🔍 Cabeçalho do arquivo: ${header}`);

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

    // Salvar em arquivo temporário com extensão correta
    const tempFilePath = path.join(app.getPath('temp'), `temp_audio_${uuidv4()}${extension}`);
    await fs.promises.writeFile(tempFilePath, buffer);

    console.log(`💾 Áudio salvo: ${tempFilePath} (${buffer.length} bytes, ${mimeType})`);

    // Processar a transcrição
    await this.processRecording({ audioFile: tempFilePath, duration });

    return { audioFile: tempFilePath, duration };
  }

  async startRecording(): Promise<void> {
    if (this.recordingState.isRecording) {
      console.log('⚠️ Já está gravando');
      return;
    }

    if (!this.transcriptionProvider.isConfigured()) {
      const providerName = this.transcriptionProvider.getProviderName();
      throw new Error(`${providerName} não está configurado corretamente`);
    }

    // Delegar para o renderer process via Web Audio API
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        await this.mainWindow.webContents.executeJavaScript(`
          window.audioRecorder.startRecording()
        `);
      } catch (error) {
        console.error('Erro ao iniciar gravação:', error);
        throw new Error('Falha ao iniciar gravação. Verifique as permissões do microfone.');
      }
    } else {
      throw new Error('Janela principal não disponível');
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recordingState.isRecording) {
      console.log('⚠️ Não está gravando');
      return;
    }

    try {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        await this.mainWindow.webContents.executeJavaScript(`
          window.audioRecorder.stopRecording()
        `);
      }
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      this.emit('error', error);
    }
  }

  private async processRecording(recordingData: { audioFile: string; duration: number }): Promise<void> {
    try {
      this.emit('processing-started');
      console.log('🔄 Processando transcrição...');

      const settings = this.settingsManager.loadSettings();

      // Get language based on provider
      let language = settings.api.language; // Default fallback
      if (settings.transcription.provider === 'groq') {
        language = settings.transcription.groq.language;
      }

      const transcriptionText = await this.transcriptionProvider.transcribeAudio(
        recordingData.audioFile,
        language
      );

      // Criar sessão de transcrição
      const session: TranscriptionSession = {
        id: uuidv4(),
        timestamp: new Date(),
        transcription: transcriptionText,
        duration: recordingData.duration,
        language: settings.api.language,
        confidence: 0.95 // Confiança padrão (pode variar por provedor)
      };

      // Adicionar ao histórico
      this.transcriptionHistory.unshift(session);

      // Manter apenas últimas 50 transcrições
      if (this.transcriptionHistory.length > 50) {
        this.transcriptionHistory = this.transcriptionHistory.slice(0, 50);
      }

      // Salvar histórico
      this.historyManager.saveHistory(this.transcriptionHistory);

      this.emit('transcription-completed', session);
      console.log('✅ Transcrição concluída:', transcriptionText);

      // Inserir texto automaticamente se configurado
      // Mas NÃO inserir se estivermos em modo code snippet (será tratado pelo main.ts)
      if (settings.behavior.autoInsert && transcriptionText.trim() && !this.isCodeSnippetMode) {
        await this.insertTranscriptionText(transcriptionText);
      }

      // Reset code snippet mode after processing
      this.isCodeSnippetMode = false;

      // Limpar arquivo temporário
      this.cleanupTempFile(recordingData.audioFile);

    } catch (error) {
      console.error('Erro ao processar gravação:', error);
      this.emit('error', error);
    } finally {
      this.emit('processing-completed');
    }
  }

  async insertTranscriptionText(text: string): Promise<void> {
    try {
      console.log('📝 Inserindo texto transcrito...');
      const settings = this.settingsManager.loadSettings();
      await TextInserter.insertText(text, 'append', settings);
      this.emit('text-inserted', text);
    } catch (error) {
      console.error('Erro ao inserir texto:', error);
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

    // Recarregar configurações nos componentes necessários
    const newSettings = this.settingsManager.loadSettings();

    if (category === 'api' || category === 'transcription') {
      // Recriar o provedor de transcrição se as configurações mudaram
      this.transcriptionProvider = this.createTranscriptionProvider(newSettings);
    }

    if (category === 'audio') {
      // Configurações de áudio serão aplicadas na próxima gravação
      console.log('Configurações de áudio atualizadas');
    }

    this.emit('settings-updated', newSettings);
  }

  clearHistory(): void {
    this.transcriptionHistory = [];
    this.historyManager.clearHistory();
    this.emit('history-cleared');
    console.log('🗑️ Histórico de transcrições limpo');
  }

  async testApiConnection(): Promise<boolean> {
    try {
      const providerName = this.transcriptionProvider.getProviderName();
      console.log(`🧪 Testando conexão com ${providerName}...`);
      return await this.transcriptionProvider.testConnection();
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
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

      // Notificar main process se hotkeys foram atualizadas
      if (category === 'hotkeys') {
        // Emitir evento para o main process reregistrar hotkeys
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
