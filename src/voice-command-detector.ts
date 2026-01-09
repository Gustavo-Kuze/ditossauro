import { CodeLanguage, VoiceCommandResult } from './types';
import { i18nMain } from './i18n-main';

export class VoiceCommandDetector {
  /**
   * Detects a voice command from the transcription and returns the detected language
   * along with the stripped transcription (without the command prefix).
   *
   * @param transcription - The transcribed text from the user
   * @param locale - The current locale (e.g., 'en', 'pt-BR')
   * @returns VoiceCommandResult with detected language and stripped transcription
   */
  static detectCommand(transcription: string, locale: string): VoiceCommandResult {
    if (!transcription || transcription.trim() === '') {
      return {
        language: 'javascript', // Default to JavaScript
        strippedTranscription: '',
      };
    }

    // Normalize transcription
    const normalizedTranscription = transcription.trim();

    // Get command keywords for the current locale
    const commandKeywords = this.getCommandKeywords(locale);

    // Try to match each language's keywords
    for (const [language, keywords] of commandKeywords.entries()) {
      for (const keyword of keywords) {
        if (this.matchesKeyword(normalizedTranscription, keyword)) {
          // Strip the keyword from the transcription
          const stripped = this.stripCommandPrefix(normalizedTranscription, keyword);

          console.log(`🎯 Voice command detected: "${keyword}" → ${language}`);

          return {
            language,
            strippedTranscription: stripped,
            detectedKeyword: keyword,
          };
        }
      }
    }

    // No command detected, default to JavaScript (current behavior)
    console.log(`🎯 No voice command detected, defaulting to JavaScript`);
    return {
      language: 'javascript',
      strippedTranscription: normalizedTranscription,
    };
  }

  /**
   * Checks if the transcription starts with the given keyword (case-insensitive, word boundary)
   */
  private static matchesKeyword(transcription: string, keyword: string): boolean {
    const normalized = transcription.toLowerCase();
    const pattern = new RegExp(`^${keyword.toLowerCase()}\\b`, 'i');
    return pattern.test(normalized);
  }

  /**
   * Strips the command prefix from the transcription
   */
  private static stripCommandPrefix(transcription: string, keyword: string): string {
    // Match keyword at the start (case-insensitive)
    const pattern = new RegExp(`^${keyword}\\b`, 'i');
    const result = transcription.replace(pattern, '').trim();
    return result;
  }

  /**
   * Gets the command keywords for the given locale from i18n translations
   * Returns a Map of CodeLanguage to array of keywords
   */
  private static getCommandKeywords(locale: string): Map<CodeLanguage, string[]> {
    const supportedLocales = ['en', 'pt-BR'];
    const effectiveLocale = supportedLocales.includes(locale) ? locale : 'en';

    // Set the locale in i18n
    i18nMain.setLocale(effectiveLocale);

    // Create map of language to keywords
    const keywordMap = new Map<CodeLanguage, string[]>();

    // Get keywords from i18n
    const commandKeyword = i18nMain.t('voiceCommands.keywords.command');
    const javascriptKeyword = i18nMain.t('voiceCommands.keywords.javascript');
    const typescriptKeyword = i18nMain.t('voiceCommands.keywords.typescript');
    const pythonKeyword = i18nMain.t('voiceCommands.keywords.python');
    const hotkeysKeyword = i18nMain.t('voiceCommands.keywords.hotkeys');
    const translateKeyword = i18nMain.t('voiceCommands.keywords.translate');
    const broKeyword = i18nMain.t('voiceCommands.keywords.bro');

    // Map keywords to languages
    // Note: Some keywords might be the same across languages (e.g., "javascript")
    keywordMap.set('bash', [commandKeyword]);
    keywordMap.set('javascript', [javascriptKeyword]);
    keywordMap.set('typescript', [typescriptKeyword]);
    keywordMap.set('python', [pythonKeyword]);
    keywordMap.set('hotkeys', [hotkeysKeyword]);
    keywordMap.set('translate', [translateKeyword]);
    keywordMap.set('bro', [broKeyword]);

    return keywordMap;
  }
}
