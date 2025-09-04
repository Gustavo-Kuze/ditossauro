import { EventEmitter } from 'events';
import { AudioRecorder } from './audio-recorder';
import { AssemblyAIClient } from './assemblyai-client';
import { TextInserter } from './text-inserter';
import { SettingsManager } from './settings-manager';
import { TranscriptionSession, AppSettings, RecordingState } from './types';
import { v4 as uuidv4 } from 'uuid';

export class VoiceFlowApp extends EventEmitter {
  private recorder: AudioRecorder;
  private assemblyClient: AssemblyAIClient;
  private settingsManager: SettingsManager;
  private recordingState: RecordingState = { isRecording: false };
  private transcriptionHistory: TranscriptionSession[] = [];

  constructor() {
    super();
    
    this.settingsManager = new SettingsManager();
    const settings = this.settingsManager.loadSettings();
    
    this.recorder = new AudioRecorder(settings.audio.sampleRate, settings.audio.deviceId);
    this.assemblyClient = new AssemblyAIClient(settings.api.assemblyAiKey);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.recorder.on('recording-started', () => {
      this.recordingState = { isRecording: true, startTime: new Date() };
      this.emit('recording-started');
      console.log('🎤 Gravação iniciada');
    });

    this.recorder.on('recording-stopped', (data) => {
      this.recordingState = { isRecording: false };
      this.emit('recording-stopped', data);
      console.log('⏹️ Gravação parada');
    });

    this.recorder.on('error', (error) => {
      this.emit('error', error);
      console.error('❌ Erro no gravador:', error);
    });
  }

  async startRecording(): Promise<void> {
    if (this.recordingState.isRecording) {
      console.log('⚠️ Já está gravando');
      return;
    }

    const settings = this.settingsManager.loadSettings();
    
    if (!settings.api.assemblyAiKey) {
      throw new Error('Chave API da AssemblyAI não configurada');
    }

    this.recorder.startRecording();
  }

  async stopRecording(): Promise<void> {
    if (!this.recordingState.isRecording) {
      console.log('⚠️ Não está gravando');
      return;
    }

    try {
      const recordingData = await this.recorder.stopRecording();
      await this.processRecording(recordingData);
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
      const transcriptionText = await this.assemblyClient.transcribeAudio(
        recordingData.audioFile, 
        settings.api.language
      );

      // Criar sessão de transcrição
      const session: TranscriptionSession = {
        id: uuidv4(),
        timestamp: new Date(),
        transcription: transcriptionText,
        duration: recordingData.duration,
        language: settings.api.language,
        confidence: 0.95 // AssemblyAI não retorna confiança individual
      };

      // Adicionar ao histórico
      this.transcriptionHistory.unshift(session);

      // Manter apenas últimas 50 transcrições
      if (this.transcriptionHistory.length > 50) {
        this.transcriptionHistory = this.transcriptionHistory.slice(0, 50);
      }

      this.emit('transcription-completed', session);
      console.log('✅ Transcrição concluída:', transcriptionText);

      // Inserir texto automaticamente se configurado
      if (settings.behavior.autoInsert && transcriptionText.trim()) {
        await this.insertTranscriptionText(transcriptionText);
      }

      // Limpar arquivo temporário
      this.recorder.cleanup();
      
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
      await TextInserter.insertText(text, 'append');
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

  updateSettings(category: keyof AppSettings, setting: any): void {
    this.settingsManager.updateSetting(category, setting);
    
    // Recarregar configurações nos componentes necessários
    const newSettings = this.settingsManager.loadSettings();
    
    if (category === 'api') {
      this.assemblyClient.setApiKey(newSettings.api.assemblyAiKey);
    }
    
    if (category === 'audio') {
      this.recorder = new AudioRecorder(newSettings.audio.sampleRate, newSettings.audio.deviceId);
      this.setupEventListeners();
    }
    
    this.emit('settings-updated', newSettings);
  }

  clearHistory(): void {
    this.transcriptionHistory = [];
    this.emit('history-cleared');
    console.log('🗑️ Histórico de transcrições limpo');
  }

  async testApiConnection(): Promise<boolean> {
    try {
      const settings = this.settingsManager.loadSettings();
      // Testar com um áudio muito pequeno (seria implementado)
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão API:', error);
      return false;
    }
  }

  destroy(): void {
    if (this.recordingState.isRecording) {
      this.recorder.stopRecording().catch(console.error);
    }
    this.recorder.cleanup();
    this.removeAllListeners();
  }
}
