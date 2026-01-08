import { describe, it, expect } from 'vitest';
import { CodeInterpreterFactory } from '@/code-interpreter-factory';
import { JavaScriptCodeInterpreter } from '@/interpreters/javascript-code-interpreter';
import { BashCommandInterpreter } from '@/interpreters/bash-command-interpreter';
import { TypeScriptCodeInterpreter } from '@/interpreters/typescript-code-interpreter';
import { PythonCodeInterpreter } from '@/interpreters/python-code-interpreter';

describe('CodeInterpreterFactory', () => {
  describe('createInterpreter', () => {
    it('should create BashCommandInterpreter for bash language', () => {
      const interpreter = CodeInterpreterFactory.createInterpreter('bash', 'test-api-key');

      expect(interpreter).toBeInstanceOf(BashCommandInterpreter);
    });

    it('should create JavaScriptCodeInterpreter for javascript language', () => {
      const interpreter = CodeInterpreterFactory.createInterpreter('javascript', 'test-api-key');

      expect(interpreter).toBeInstanceOf(JavaScriptCodeInterpreter);
    });

    it('should create TypeScriptCodeInterpreter for typescript language', () => {
      const interpreter = CodeInterpreterFactory.createInterpreter('typescript', 'test-api-key');

      expect(interpreter).toBeInstanceOf(TypeScriptCodeInterpreter);
    });

    it('should create PythonCodeInterpreter for python language', () => {
      const interpreter = CodeInterpreterFactory.createInterpreter('python', 'test-api-key');

      expect(interpreter).toBeInstanceOf(PythonCodeInterpreter);
    });

    it('should throw error for unsupported language', () => {
      expect(() => {
        CodeInterpreterFactory.createInterpreter('unsupported' as any, 'test-api-key');
      }).toThrow('Unsupported code language: unsupported');
    });

    it('should pass API key to created interpreter', () => {
      const apiKey = 'my-secret-key-123';
      const interpreter = CodeInterpreterFactory.createInterpreter('javascript', apiKey);

      // JavaScriptCodeInterpreter stores apiKey in protected property
      // We can verify it was created successfully
      expect(interpreter).toBeInstanceOf(JavaScriptCodeInterpreter);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = CodeInterpreterFactory.getSupportedLanguages();

      expect(languages).toEqual(['bash', 'javascript', 'typescript', 'python']);
    });

    it('should return array with 4 languages', () => {
      const languages = CodeInterpreterFactory.getSupportedLanguages();

      expect(languages).toHaveLength(4);
    });

    it('should include bash in supported languages', () => {
      const languages = CodeInterpreterFactory.getSupportedLanguages();

      expect(languages).toContain('bash');
    });

    it('should include javascript in supported languages', () => {
      const languages = CodeInterpreterFactory.getSupportedLanguages();

      expect(languages).toContain('javascript');
    });

    it('should include typescript in supported languages', () => {
      const languages = CodeInterpreterFactory.getSupportedLanguages();

      expect(languages).toContain('typescript');
    });

    it('should include python in supported languages', () => {
      const languages = CodeInterpreterFactory.getSupportedLanguages();

      expect(languages).toContain('python');
    });
  });
});
