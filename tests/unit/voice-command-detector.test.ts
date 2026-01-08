import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceCommandDetector } from '@/voice-command-detector';

// Mock i18n-main module
vi.mock('@/i18n-main', () => ({
  i18nMain: {
    t: vi.fn((key: string) => {
      const translations: Record<string, string> = {
        'voiceCommands.keywords.command': 'command',
        'voiceCommands.keywords.javascript': 'javascript',
        'voiceCommands.keywords.typescript': 'typescript',
        'voiceCommands.keywords.python': 'python',
      };
      return translations[key] || key;
    }),
    setLocale: vi.fn(),
    getLocale: vi.fn(() => 'en'),
  },
}));

describe('VoiceCommandDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectCommand - Basic Detection', () => {
    it('should detect "command" keyword and return bash language', () => {
      const result = VoiceCommandDetector.detectCommand('command list files', 'en');

      expect(result.language).toBe('bash');
      expect(result.strippedTranscription).toBe('list files');
      expect(result.detectedKeyword).toBe('command');
    });

    it('should detect "javascript" keyword and return javascript language', () => {
      const result = VoiceCommandDetector.detectCommand('javascript create a function', 'en');

      expect(result.language).toBe('javascript');
      expect(result.strippedTranscription).toBe('create a function');
      expect(result.detectedKeyword).toBe('javascript');
    });

    it('should detect "typescript" keyword and return typescript language', () => {
      const result = VoiceCommandDetector.detectCommand('typescript interface user', 'en');

      expect(result.language).toBe('typescript');
      expect(result.strippedTranscription).toBe('interface user');
      expect(result.detectedKeyword).toBe('typescript');
    });

    it('should detect "python" keyword and return python language', () => {
      const result = VoiceCommandDetector.detectCommand('python print hello world', 'en');

      expect(result.language).toBe('python');
      expect(result.strippedTranscription).toBe('print hello world');
      expect(result.detectedKeyword).toBe('python');
    });
  });

  describe('detectCommand - Default Behavior', () => {
    it('should default to JavaScript when no keyword detected', () => {
      const result = VoiceCommandDetector.detectCommand('create a function to add numbers', 'en');

      expect(result.language).toBe('javascript');
      expect(result.strippedTranscription).toBe('create a function to add numbers');
      expect(result.detectedKeyword).toBeUndefined();
    });

    it('should default to JavaScript for empty transcription', () => {
      const result = VoiceCommandDetector.detectCommand('', 'en');

      expect(result.language).toBe('javascript');
      expect(result.strippedTranscription).toBe('');
      expect(result.detectedKeyword).toBeUndefined();
    });
  });

  describe('detectCommand - Case Insensitivity', () => {
    it('should detect uppercase keyword', () => {
      const result = VoiceCommandDetector.detectCommand('COMMAND list files', 'en');

      expect(result.language).toBe('bash');
      expect(result.strippedTranscription).toBe('list files');
    });

    it('should detect mixed case keyword', () => {
      const result = VoiceCommandDetector.detectCommand('JavaScript create function', 'en');

      expect(result.language).toBe('javascript');
      expect(result.strippedTranscription).toBe('create function');
    });

    it('should detect lowercase keyword', () => {
      const result = VoiceCommandDetector.detectCommand('python print hello', 'en');

      expect(result.language).toBe('python');
      expect(result.strippedTranscription).toBe('print hello');
    });
  });

  describe('detectCommand - Word Boundaries', () => {
    it('should NOT match partial words - "commander" should not match "command"', () => {
      const result = VoiceCommandDetector.detectCommand('commander list files', 'en');

      expect(result.language).toBe('javascript'); // Default
      expect(result.strippedTranscription).toBe('commander list files'); // Not stripped
      expect(result.detectedKeyword).toBeUndefined();
    });

    it('should NOT match keyword in middle of sentence', () => {
      const result = VoiceCommandDetector.detectCommand('use command pattern', 'en');

      expect(result.language).toBe('javascript'); // Default
      expect(result.strippedTranscription).toBe('use command pattern');
      expect(result.detectedKeyword).toBeUndefined();
    });

    it('should match keyword only at start of transcription', () => {
      const result = VoiceCommandDetector.detectCommand('command list files with command pattern', 'en');

      expect(result.language).toBe('bash');
      expect(result.strippedTranscription).toBe('list files with command pattern');
      // Only the first "command" should be stripped
    });
  });

  describe('detectCommand - Whitespace Handling', () => {
    it('should handle leading whitespace', () => {
      const result = VoiceCommandDetector.detectCommand('   command list files', 'en');

      expect(result.language).toBe('bash');
      expect(result.strippedTranscription).toBe('list files');
    });

    it('should handle trailing whitespace', () => {
      const result = VoiceCommandDetector.detectCommand('command list files   ', 'en');

      expect(result.language).toBe('bash');
      expect(result.strippedTranscription).toBe('list files');
    });

    it('should handle whitespace around keyword', () => {
      const result = VoiceCommandDetector.detectCommand('  javascript   create function  ', 'en');

      expect(result.language).toBe('javascript');
      expect(result.strippedTranscription).toBe('create function');
    });

    it('should handle single whitespace after keyword', () => {
      const result = VoiceCommandDetector.detectCommand('python print', 'en');

      expect(result.language).toBe('python');
      expect(result.strippedTranscription).toBe('print');
    });
  });

describe('detectCommand - Portuguese Locale', () => {
  let originalMockImplementation: any;

  beforeEach(async () => {
    // Reimport to get fresh mock
    const { i18nMain } = await import('@/i18n-main');

    // Save original implementation
    originalMockImplementation = vi.mocked(i18nMain.t).getMockImplementation();

    // Override mock for Portuguese translations
    vi.mocked(i18nMain.t).mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'voiceCommands.keywords.command': 'comando',
        'voiceCommands.keywords.javascript': 'javascript',
        'voiceCommands.keywords.typescript': 'typescript',
        'voiceCommands.keywords.python': 'python',
      };
      return translations[key] || key;
    });
  });

  afterEach(async () => {
    // Restore original mock implementation
    const { i18nMain } = await import('@/i18n-main');
    vi.mocked(i18nMain.t).mockImplementation(originalMockImplementation);
  });

  it('should detect Portuguese "comando" keyword', () => {
    const result = VoiceCommandDetector.detectCommand('comando listar arquivos', 'pt-BR');

    expect(result.language).toBe('bash');
    expect(result.strippedTranscription).toBe('listar arquivos');
    expect(result.detectedKeyword).toBe('comando');
  });

  it('should still detect "javascript" in Portuguese locale', () => {
    const result = VoiceCommandDetector.detectCommand('javascript criar função', 'pt-BR');

    expect(result.language).toBe('javascript');
    expect(result.strippedTranscription).toBe('criar função');
  });
});

  describe('detectCommand - Edge Cases', () => {
    it('should handle keyword with no following text', () => {
      const result = VoiceCommandDetector.detectCommand('command', 'en');

      // "command" alone matches because \b matches at end of string
      expect(result.language).toBe('bash');
      expect(result.strippedTranscription).toBe('');
      expect(result.detectedKeyword).toBe('command');
    });

    it('should handle transcription with only whitespace', () => {
      const result = VoiceCommandDetector.detectCommand('   ', 'en');

      expect(result.language).toBe('javascript'); // Default
      expect(result.strippedTranscription).toBe('');
    });

    it('should handle special characters after keyword', () => {
      const result = VoiceCommandDetector.detectCommand('python: print hello', 'en');

      // "python:" DOES match because colon is a word boundary
      expect(result.language).toBe('python');
      expect(result.strippedTranscription).toBe(': print hello');
    });

    it('should handle multiple spaces between keyword and text', () => {
      const result = VoiceCommandDetector.detectCommand('javascript    create function', 'en');

      expect(result.language).toBe('javascript');
      expect(result.strippedTranscription).toBe('create function');
    });
  });

  describe('detectCommand - All Language Types', () => {
    it('should correctly map all supported languages', () => {
      const testCases = [
        { input: 'command list files', expected: 'bash' }, // Use same pattern as working tests
        { input: 'javascript create function', expected: 'javascript' },
        { input: 'typescript interface user', expected: 'typescript' },
        { input: 'python print hello', expected: 'python' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = VoiceCommandDetector.detectCommand(input, 'en');
        expect(result.language).toBe(expected);
      });
    });
  });
});
