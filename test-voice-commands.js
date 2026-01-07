/**
 * Test script for voice command detection
 * Run with: node test-voice-commands.js
 */

// Mock i18n for testing
const mockTranslations = {
  'en': {
    'voiceCommands.keywords.command': 'command',
    'voiceCommands.keywords.javascript': 'javascript',
    'voiceCommands.keywords.typescript': 'typescript',
    'voiceCommands.keywords.python': 'python'
  },
  'pt-BR': {
    'voiceCommands.keywords.command': 'comando',
    'voiceCommands.keywords.javascript': 'javascript',
    'voiceCommands.keywords.typescript': 'typescript',
    'voiceCommands.keywords.python': 'python'
  }
};

let currentLocale = 'en';

const mockI18n = {
  setLocale: (locale) => {
    currentLocale = locale;
  },
  t: (key) => {
    return mockTranslations[currentLocale]?.[key] || key;
  }
};

// Simulate the VoiceCommandDetector class
class VoiceCommandDetector {
  static detectCommand(transcription, locale) {
    if (!transcription || transcription.trim() === '') {
      return {
        language: 'javascript',
        strippedTranscription: '',
      };
    }

    const normalizedTranscription = transcription.trim();
    const commandKeywords = this.getCommandKeywords(locale);

    for (const [language, keywords] of commandKeywords.entries()) {
      for (const keyword of keywords) {
        if (this.matchesKeyword(normalizedTranscription, keyword)) {
          const stripped = this.stripCommandPrefix(normalizedTranscription, keyword);

          return {
            language,
            strippedTranscription: stripped,
            detectedKeyword: keyword,
          };
        }
      }
    }

    return {
      language: 'javascript',
      strippedTranscription: normalizedTranscription,
    };
  }

  static matchesKeyword(transcription, keyword) {
    const normalized = transcription.toLowerCase();
    const pattern = new RegExp(`^${keyword.toLowerCase()}\\b`, 'i');
    return pattern.test(normalized);
  }

  static stripCommandPrefix(transcription, keyword) {
    const pattern = new RegExp(`^${keyword}\\s*`, 'i');
    return transcription.replace(pattern, '').trim();
  }

  static getCommandKeywords(locale) {
    const supportedLocales = ['en', 'pt-BR'];
    const effectiveLocale = supportedLocales.includes(locale) ? locale : 'en';

    mockI18n.setLocale(effectiveLocale);

    const keywordMap = new Map();

    const commandKeyword = mockI18n.t('voiceCommands.keywords.command');
    const javascriptKeyword = mockI18n.t('voiceCommands.keywords.javascript');
    const typescriptKeyword = mockI18n.t('voiceCommands.keywords.typescript');
    const pythonKeyword = mockI18n.t('voiceCommands.keywords.python');

    keywordMap.set('bash', [commandKeyword]);
    keywordMap.set('javascript', [javascriptKeyword]);
    keywordMap.set('typescript', [typescriptKeyword]);
    keywordMap.set('python', [pythonKeyword]);

    return keywordMap;
  }
}

// Test cases
const tests = [
  // English commands
  { input: 'command list files', locale: 'en', expectedLanguage: 'bash', expectedStripped: 'list files' },
  { input: 'javascript create function', locale: 'en', expectedLanguage: 'javascript', expectedStripped: 'create function' },
  { input: 'typescript user interface', locale: 'en', expectedLanguage: 'typescript', expectedStripped: 'user interface' },
  { input: 'python hello world', locale: 'en', expectedLanguage: 'python', expectedStripped: 'hello world' },

  // Portuguese commands
  { input: 'comando listar arquivos', locale: 'pt-BR', expectedLanguage: 'bash', expectedStripped: 'listar arquivos' },
  { input: 'javascript criar função', locale: 'pt-BR', expectedLanguage: 'javascript', expectedStripped: 'criar função' },
  { input: 'typescript interface usuario', locale: 'pt-BR', expectedLanguage: 'typescript', expectedStripped: 'interface usuario' },
  { input: 'python ola mundo', locale: 'pt-BR', expectedLanguage: 'python', expectedStripped: 'ola mundo' },

  // Edge cases - uppercase
  { input: 'COMMAND list files', locale: 'en', expectedLanguage: 'bash', expectedStripped: 'list files' },
  { input: 'JavaScript create function', locale: 'en', expectedLanguage: 'javascript', expectedStripped: 'create function' },

  // Edge cases - extra spaces
  { input: '  command   list files  ', locale: 'en', expectedLanguage: 'bash', expectedStripped: 'list files' },

  // Edge cases - no command (defaults to JavaScript)
  { input: 'create a function', locale: 'en', expectedLanguage: 'javascript', expectedStripped: 'create a function' },
  { input: 'criar uma função', locale: 'pt-BR', expectedLanguage: 'javascript', expectedStripped: 'criar uma função' },

  // Edge cases - word boundary (should NOT match "commander")
  { input: 'commander list files', locale: 'en', expectedLanguage: 'javascript', expectedStripped: 'commander list files' },

  // Edge cases - empty/whitespace
  { input: '', locale: 'en', expectedLanguage: 'javascript', expectedStripped: '' },
  { input: '   ', locale: 'en', expectedLanguage: 'javascript', expectedStripped: '' },

  // Edge cases - only command word
  { input: 'command', locale: 'en', expectedLanguage: 'bash', expectedStripped: '' },
  { input: 'javascript', locale: 'en', expectedLanguage: 'javascript', expectedStripped: '' },
];

// Run tests
console.log('🧪 Testing Voice Command Detection\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  const result = VoiceCommandDetector.detectCommand(test.input, test.locale);

  const languageMatch = result.language === test.expectedLanguage;
  const strippedMatch = result.strippedTranscription === test.expectedStripped;
  const success = languageMatch && strippedMatch;

  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1}: PASSED`);
  } else {
    failed++;
    console.log(`❌ Test ${index + 1}: FAILED`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Locale: ${test.locale}`);
    console.log(`   Expected language: ${test.expectedLanguage}, Got: ${result.language}`);
    console.log(`   Expected stripped: "${test.expectedStripped}", Got: "${result.strippedTranscription}"`);
  }

  if (success) {
    console.log(`   Input: "${test.input}" (${test.locale})`);
    console.log(`   Detected: ${result.language} | Stripped: "${result.strippedTranscription}"`);
  }
  console.log('');
});

console.log('='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed!');
  process.exit(1);
}
