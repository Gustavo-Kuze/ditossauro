import { AssemblyAI } from 'assemblyai';
import { ITranscriptionProvider, AssemblyAIConfig } from './transcription-provider';

export class AssemblyAIClient implements ITranscriptionProvider {
  private client: AssemblyAI | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeClient();
  }

  private initializeClient(): void {
    if (this.apiKey && this.apiKey.trim()) {
      this.client = new AssemblyAI({
        apiKey: this.apiKey,
      });
      console.log('✅ AssemblyAI client initialized');
    } else {
      this.client = null;
      console.log('⚠️ API key not provided - client not initialized');
    }
  }

  async transcribeAudio(audioFilePath: string, language = 'pt'): Promise<string> {
    if (!this.client) {
      throw new Error('AssemblyAI client was not initialized. Check the API key.');
    }

    try {
      console.log('🚀 Starting transcription with AssemblyAI SDK...');
      console.log(`📁 File: ${audioFilePath}`);
      console.log(`🌍 Language: ${language}`);

      // Configure transcription parameters
      const params = {
        audio: audioFilePath,
        // language_code: language === 'pt' ? 'pt' : 'en',
        language_detection: true,
        punctuate: true,
        format_text: true,
        // Opções adicionais para melhor qualidade
        speaker_labels: false, // Não precisamos de identificação de falantes
        auto_chapters: false,  // Não precisamos de capítulos
        summarization: false,  // Não precisamos de resumo
        sentiment_analysis: false, // Não precisamos de análise de sentimento
      };

      console.log('📤 Sending file for transcription...');

      // Use the SDK to transcribe (handles upload and polling automatically)
      const transcript = await this.client.transcripts.transcribe(params);

      // Check if there was an error
      if (transcript.status === 'error') {
        const errorMessage = transcript.error || 'Erro desconhecido na transcrição';
        console.error('❌ Error in transcription:', errorMessage);
        throw new Error(`Erro na transcrição: ${errorMessage}`);
      }

      // Check if the transcription was completed
      if (transcript.status !== 'completed') {
        console.error('❌ Transcription was not completed:', transcript.status);
        throw new Error(`Transcription failed with status: ${transcript.status}`);
      }

      const transcriptionText = transcript.text || '';

      if (!transcriptionText.trim()) {
        console.warn('⚠️ Transcription returned empty');
        throw new Error('No text was transcribed. Check if there is speech in the audio.');
      }

      console.log('✅ Transcription completed successfully!');
      console.log(`📝 Text (${transcriptionText.length} characters): ${transcriptionText.substring(0, 100)}...`);
      console.log(`📊 Confidence: ${transcript.confidence ? (transcript.confidence * 100).toFixed(1) : 'N/A'}%`);
      console.log(`⏱️ Audio duration: ${transcript.audio_duration || 'N/A'}s`);

      return transcriptionText;

    } catch (error) {
      console.error('❌ Error during transcription:', error);

      // Improve error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid file format')) {
          throw new Error('Unsupported audio format. Try recording again.');
        } else if (error.message.includes('File too large')) {
          throw new Error('Audio file too large. Try a shorter recording.');
        } else if (error.message.includes('Invalid API key')) {
          throw new Error('Invalid API key. Check your configuration.');
        } else if (error.message.includes('Insufficient credits')) {
          throw new Error('Insufficient credits in your AssemblyAI account.');
        }
      }

      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      console.log('🧪 Testing connection with AssemblyAI...');

      // Make a simple call to test connection and API key
      // Let's try to list transcriptions (without using any)
      await this.client.transcripts.list({ limit: 1 });

      console.log('✅ Connection with AssemblyAI working!');
      return true;

    } catch (error) {
      console.error('❌ Error testing connection:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'AssemblyAI';
  }

  setConfig(config: Record<string, unknown>): void {
    const assemblyConfig = config as unknown as AssemblyAIConfig;
    if (assemblyConfig.apiKey) {
      this.setApiKey(assemblyConfig.apiKey);
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initializeClient();
  }

  getApiKey(): string {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey.trim().length > 0;
  }
}