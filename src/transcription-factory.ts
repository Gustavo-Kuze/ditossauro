import { ITranscriptionProvider, TranscriptionProviderType, FasterWhisperConfig, AssemblyAIConfig, GroqConfig } from './transcription-provider';
import { AssemblyAIClient } from './assemblyai-client';
import { FasterWhisperClient } from './faster-whisper-client';
import { GroqClient } from './groq-client';

/**
 * Factory para criar instâncias de provedores de transcrição
 */
export class TranscriptionFactory {
  /**
   * Cria um provedor de transcrição baseado no tipo especificado
   */
  static createProvider(
    type: TranscriptionProviderType,
    config?: FasterWhisperConfig | AssemblyAIConfig | GroqConfig
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

      case 'groq': {
        const groqConfig = config as GroqConfig;
        return new GroqClient(groqConfig);
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
        type: 'groq',
        name: 'Groq',
        description: 'Transcrição em nuvem ultra-rápida usando Whisper Large V3'
      },
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
  static getDefaultConfig(type: TranscriptionProviderType): FasterWhisperConfig | AssemblyAIConfig | GroqConfig {
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

      case 'groq': {
        return {
          apiKey: '',
          modelName: 'whisper-large-v3',
          language: '' // Empty for auto-detect
        } as GroqConfig;
      }

      default:
        throw new Error(`Provedor não suportado: ${type}`);
    }
  }
}
