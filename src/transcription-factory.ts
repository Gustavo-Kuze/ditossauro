import { ITranscriptionProvider, TranscriptionProviderType, FasterWhisperConfig, AssemblyAIConfig } from './transcription-provider';
import { AssemblyAIClient } from './assemblyai-client';
import { FasterWhisperClient } from './faster-whisper-client';

/**
 * Factory para criar instâncias de provedores de transcrição
 */
export class TranscriptionFactory {
  /**
   * Cria um provedor de transcrição baseado no tipo especificado
   */
  static createProvider(
    type: TranscriptionProviderType,
    config?: FasterWhisperConfig | AssemblyAIConfig
  ): ITranscriptionProvider {
    switch (type) {
      case 'assemblyai': {
        const assemblyConfig = config as AssemblyAIConfig;
        return new AssemblyAIClient(assemblyConfig?.apiKey || '');
      }

      case 'faster-whisper': {
        const whisperConfig = config as FasterWhisperConfig;
        return new FasterWhisperClient(whisperConfig);
      }

      default:
        throw new Error(`Provedor de transcrição não suportado: ${type}`);
    }
  }

  /**
   * Lista todos os provedores disponíveis
   */
  static getAvailableProviders(): { type: TranscriptionProviderType; name: string; description: string }[] {
    return [
      {
        type: 'assemblyai',
        name: 'AssemblyAI',
        description: 'Serviço de transcrição em nuvem com alta precisão'
      },
      {
        type: 'faster-whisper',
        name: 'Faster Whisper',
        description: 'Transcrição local usando OpenAI Whisper otimizado'
      }
    ];
  }

  /**
   * Retorna as configurações padrão para um provedor
   */
  static getDefaultConfig(type: TranscriptionProviderType): FasterWhisperConfig | AssemblyAIConfig {
    switch (type) {
      case 'assemblyai': {
        return {
          apiKey: ''
        } as AssemblyAIConfig;
      }

      case 'faster-whisper': {
        return {
          modelSize: 'base',
          device: 'cpu',
          computeType: 'int8',
          pythonPath: 'python'
        } as FasterWhisperConfig;
      }

      default:
        throw new Error(`Provedor não suportado: ${type}`);
    }
  }
}
