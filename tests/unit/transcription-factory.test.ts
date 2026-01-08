import { describe, it, expect } from 'vitest';
import { TranscriptionFactory } from '@/transcription-factory';
import { AssemblyAIClient } from '@/assemblyai-client';
import { FasterWhisperClient } from '@/faster-whisper-client';
import { GroqClient } from '@/groq-client';

describe('TranscriptionFactory', () => {
  describe('createProvider', () => {
    it('should create AssemblyAIClient for assemblyai type', () => {
      const provider = TranscriptionFactory.createProvider('assemblyai', {
        apiKey: 'test-assembly-key'
      });

      expect(provider).toBeInstanceOf(AssemblyAIClient);
    });

    it('should create FasterWhisperClient for faster-whisper type', () => {
      const provider = TranscriptionFactory.createProvider('faster-whisper', {
        modelSize: 'base',
        device: 'cpu',
        computeType: 'int8',
        pythonPath: 'python'
      });

      expect(provider).toBeInstanceOf(FasterWhisperClient);
    });

    it('should create GroqClient for groq type', () => {
      const provider = TranscriptionFactory.createProvider('groq', {
        apiKey: 'test-groq-key',
        modelName: 'whisper-large-v3',
        language: 'en'
      });

      expect(provider).toBeInstanceOf(GroqClient);
    });

    it('should create AssemblyAIClient with empty API key if config not provided', () => {
      const provider = TranscriptionFactory.createProvider('assemblyai');

      expect(provider).toBeInstanceOf(AssemblyAIClient);
    });

    it('should throw error for unsupported provider type', () => {
      expect(() => {
        TranscriptionFactory.createProvider('unsupported' as any);
      }).toThrow('Transcription provider not supported: unsupported');
    });
  });

  describe('getAvailableProviders', () => {
    it('should return array of 3 providers', () => {
      const providers = TranscriptionFactory.getAvailableProviders();

      expect(providers).toHaveLength(3);
    });

    it('should include groq provider', () => {
      const providers = TranscriptionFactory.getAvailableProviders();
      const groqProvider = providers.find(p => p.type === 'groq');

      expect(groqProvider).toBeDefined();
      expect(groqProvider?.name).toBe('Groq');
      expect(groqProvider?.description).toContain('Whisper Large V3');
    });

    it('should include assemblyai provider', () => {
      const providers = TranscriptionFactory.getAvailableProviders();
      const assemblyProvider = providers.find(p => p.type === 'assemblyai');

      expect(assemblyProvider).toBeDefined();
      expect(assemblyProvider?.name).toBe('AssemblyAI');
    });

    it('should include faster-whisper provider', () => {
      const providers = TranscriptionFactory.getAvailableProviders();
      const whisperProvider = providers.find(p => p.type === 'faster-whisper');

      expect(whisperProvider).toBeDefined();
      expect(whisperProvider?.name).toBe('Faster Whisper');
    });

    it('should return providers with type, name, and description', () => {
      const providers = TranscriptionFactory.getAvailableProviders();

      providers.forEach(provider => {
        expect(provider).toHaveProperty('type');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('description');
        expect(typeof provider.type).toBe('string');
        expect(typeof provider.name).toBe('string');
        expect(typeof provider.description).toBe('string');
      });
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config for assemblyai', () => {
      const config = TranscriptionFactory.getDefaultConfig('assemblyai');

      expect(config).toEqual({
        apiKey: ''
      });
    });

    it('should return default config for faster-whisper', () => {
      const config = TranscriptionFactory.getDefaultConfig('faster-whisper');

      expect(config).toEqual({
        modelSize: 'base',
        device: 'cpu',
        computeType: 'int8',
        pythonPath: 'python'
      });
    });

    it('should return default config for groq', () => {
      const config = TranscriptionFactory.getDefaultConfig('groq');

      expect(config).toEqual({
        apiKey: '',
        modelName: 'whisper-large-v3',
        language: '' // Empty for auto-detect
      });
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        TranscriptionFactory.getDefaultConfig('unsupported' as any);
      }).toThrow('Provider not supported: unsupported');
    });

    it('should return config with empty apiKey for cloud providers', () => {
      const assemblyConfig = TranscriptionFactory.getDefaultConfig('assemblyai');
      const groqConfig = TranscriptionFactory.getDefaultConfig('groq');

      expect((assemblyConfig as any).apiKey).toBe('');
      expect((groqConfig as any).apiKey).toBe('');
    });

    it('should return config with base model for faster-whisper', () => {
      const config = TranscriptionFactory.getDefaultConfig('faster-whisper');

      expect((config as any).modelSize).toBe('base');
    });
  });
});
