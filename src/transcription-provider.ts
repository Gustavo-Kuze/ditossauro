/**
 * Interface abstrata para provedores de transcrição
 */
export interface ITranscriptionProvider {
  /**
   * Transcreve um arquivo de áudio
   * @param audioFilePath Caminho para o arquivo de áudio
   * @param language Código do idioma (opcional)
   * @returns Texto transcrito
   */
  transcribeAudio(audioFilePath: string, language?: string): Promise<string>;

  /**
   * Testa a conexão/configuração do provedor
   * @returns true se o provedor está funcionando
   */
  testConnection(): Promise<boolean>;

  /**
   * Define configurações específicas do provedor
   * @param config Configurações do provedor
   */
  setConfig(config: Record<string, unknown>): void;

  /**
   * Verifica se o provedor está configurado corretamente
   * @returns true se configurado
   */
  isConfigured(): boolean;

  /**
   * Retorna o nome do provedor
   */
  getProviderName(): string;
}

/**
 * Resultado detalhado da transcrição
 */
export interface TranscriptionResult {
  text: string;
  language: string;
  confidence?: number;
  duration?: number;
  segments?: TranscriptionSegment[];
}

/**
 * Segmento individual da transcrição
 */
export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

/**
 * Configurações para Faster Whisper
 */
export interface FasterWhisperConfig {
  modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';
  device: 'cpu' | 'cuda';
  computeType: 'int8' | 'int8_float16' | 'int16' | 'float16' | 'float32';
  pythonPath?: string;
  scriptPath?: string;
}

/**
 * Configurações para AssemblyAI
 */
export interface AssemblyAIConfig {
  apiKey: string;
}

/**
 * Tipos de provedores disponíveis
 */
export type TranscriptionProviderType = 'assemblyai' | 'faster-whisper';
