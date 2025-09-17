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
      console.log('✅ Cliente AssemblyAI inicializado');
    } else {
      this.client = null;
      console.log('⚠️ Chave API não fornecida - cliente não inicializado');
    }
  }

  async transcribeAudio(audioFilePath: string, language = 'pt'): Promise<string> {
    if (!this.client) {
      throw new Error('Cliente AssemblyAI não foi inicializado. Verifique a chave API.');
    }

    try {
      console.log('🚀 Iniciando transcrição com AssemblyAI SDK...');
      console.log(`📁 Arquivo: ${audioFilePath}`);
      console.log(`🌍 Idioma: ${language}`);
      
      // Configurar parâmetros da transcrição
      const params = {
        audio: audioFilePath,
        language_code: language === 'pt' ? 'pt' : 'en',
        punctuate: true,
        format_text: true,
        // Opções adicionais para melhor qualidade
        speaker_labels: false, // Não precisamos de identificação de falantes
        auto_chapters: false,  // Não precisamos de capítulos
        summarization: false,  // Não precisamos de resumo
        sentiment_analysis: false, // Não precisamos de análise de sentimento
      };

      console.log('📤 Enviando arquivo para transcrição...');
      
      // Usar o SDK para transcrever (cuida automaticamente do upload e polling)
      const transcript = await this.client.transcripts.transcribe(params);
      
      // Verificar se houve erro
      if (transcript.status === 'error') {
        const errorMessage = transcript.error || 'Erro desconhecido na transcrição';
        console.error('❌ Erro na transcrição:', errorMessage);
        throw new Error(`Erro na transcrição: ${errorMessage}`);
      }
      
      // Verificar se a transcrição foi concluída
      if (transcript.status !== 'completed') {
        console.error('❌ Transcrição não foi concluída:', transcript.status);
        throw new Error(`Transcrição falhou com status: ${transcript.status}`);
      }

      const transcriptionText = transcript.text || '';
      
      if (!transcriptionText.trim()) {
        console.warn('⚠️ Transcrição retornou vazia');
        throw new Error('Nenhum texto foi transcrito. Verifique se há fala no áudio.');
      }

      console.log('✅ Transcrição concluída com sucesso!');
      console.log(`📝 Texto (${transcriptionText.length} caracteres): ${transcriptionText.substring(0, 100)}...`);
      console.log(`📊 Confiança: ${transcript.confidence ? (transcript.confidence * 100).toFixed(1) : 'N/A'}%`);
      console.log(`⏱️ Duração do áudio: ${transcript.audio_duration || 'N/A'}s`);
      
      return transcriptionText;
      
    } catch (error) {
      console.error('❌ Erro durante transcrição:', error);
      
      // Melhorar mensagens de erro
      if (error instanceof Error) {
        if (error.message.includes('Invalid file format')) {
          throw new Error('Formato de áudio não suportado. Tente gravar novamente.');
        } else if (error.message.includes('File too large')) {
          throw new Error('Arquivo de áudio muito grande. Tente uma gravação mais curta.');
        } else if (error.message.includes('Invalid API key')) {
          throw new Error('Chave API inválida. Verifique sua configuração.');
        } else if (error.message.includes('Insufficient credits')) {
          throw new Error('Créditos insuficientes na sua conta AssemblyAI.');
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
      console.log('🧪 Testando conexão com AssemblyAI...');
      
      // Fazer uma chamada simples para testar a conexão e chave API
      // Vamos tentar listar transcrições (sem usar nenhuma)
      await this.client.transcripts.list({ limit: 1 });
      
      console.log('✅ Conexão com AssemblyAI funcionando!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
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