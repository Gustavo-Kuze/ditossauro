import { BaseCodeInterpreter } from './interpreters/base-code-interpreter';
import { JavaScriptCodeInterpreter } from './interpreters/javascript-code-interpreter';
import { BashCommandInterpreter } from './interpreters/bash-command-interpreter';
import { TypeScriptCodeInterpreter } from './interpreters/typescript-code-interpreter';
import { PythonCodeInterpreter } from './interpreters/python-code-interpreter';
import { HotkeyInterpreter } from './interpreters/hotkey-interpreter';
import { TranslateInterpreter } from './interpreters/translate-interpreter';
import { DitoInterpreter } from './interpreters/dito-interpreter';
import { CodeLanguage } from './types';

export class CodeInterpreterFactory {
  static createInterpreter(
    language: CodeLanguage,
    apiKey: string
  ): BaseCodeInterpreter {
    switch (language) {
      case 'bash':
        return new BashCommandInterpreter(apiKey);
      case 'javascript':
        return new JavaScriptCodeInterpreter(apiKey);
      case 'typescript':
        return new TypeScriptCodeInterpreter(apiKey);
      case 'python':
        return new PythonCodeInterpreter(apiKey);
      case 'hotkeys':
        return new HotkeyInterpreter(apiKey);
      case 'translate':
        return new TranslateInterpreter(apiKey);
      case 'dito':
        return new DitoInterpreter(apiKey);
      default:
        throw new Error(`Unsupported code language: ${language}`);
    }
  }

  static getSupportedLanguages(): CodeLanguage[] {
    return ['bash', 'javascript', 'typescript', 'python', 'hotkeys', 'translate', 'dito'];
  }
}
