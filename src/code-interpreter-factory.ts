import { BaseCodeInterpreter } from './interpreters/base-code-interpreter';
import { JavaScriptCodeInterpreter } from './interpreters/javascript-code-interpreter';
import { BashCommandInterpreter } from './interpreters/bash-command-interpreter';
import { TypeScriptCodeInterpreter } from './interpreters/typescript-code-interpreter';
import { PythonCodeInterpreter } from './interpreters/python-code-interpreter';
import { HotkeyInterpreter } from './interpreters/hotkey-interpreter';
import { TranslateInterpreter } from './interpreters/translate-interpreter';
import { BroInterpreter } from './interpreters/bro-interpreter';
import { CodeLanguage, AppSettings } from './types';
import { ProviderFactory } from './providers/provider-factory';

export class CodeInterpreterFactory {
  static createInterpreter(
    language: CodeLanguage,
    settings: AppSettings
  ): BaseCodeInterpreter {
    // Create provider based on settings
    const provider = ProviderFactory.createProvider(settings);
    const options = ProviderFactory.getCompletionOptions(settings);

    switch (language) {
      case 'bash':
        return new BashCommandInterpreter(provider, options);
      case 'javascript':
        return new JavaScriptCodeInterpreter(provider, options);
      case 'typescript':
        return new TypeScriptCodeInterpreter(provider, options);
      case 'python':
        return new PythonCodeInterpreter(provider, options);
      case 'hotkeys':
        return new HotkeyInterpreter(provider, options);
      case 'translate':
        return new TranslateInterpreter(provider, options);
      case 'bro':
        return new BroInterpreter(provider, options);
      default:
        throw new Error(`Unsupported code language: ${language}`);
    }
  }

  static getSupportedLanguages(): CodeLanguage[] {
    return ['bash', 'javascript', 'typescript', 'python', 'hotkeys', 'translate', 'bro'];
  }
}
