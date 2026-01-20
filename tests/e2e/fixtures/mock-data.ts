/**
 * Mock data fixtures for e2e tests
 */

/**
 * Mock settings data
 */
export const mockSettings = {
  default: {
    locale: 'en',
    hotkey: 'Ctrl+Win',
    pushToTalk: false,
    autoInsert: true,
    showNotifications: true,
    transcriptionProvider: 'groq',
    groqApiKey: 'test-api-key',
    assemblyAIApiKey: '',
    language: 'auto',
  },
  portuguese: {
    locale: 'pt-BR',
    hotkey: 'Ctrl+Shift+Win',
    pushToTalk: true,
    autoInsert: false,
    showNotifications: false,
    transcriptionProvider: 'assemblyai',
    groqApiKey: '',
    assemblyAIApiKey: 'test-assembly-key',
    language: 'pt',
  },
  minimal: {
    locale: 'en',
    transcriptionProvider: 'groq',
    groqApiKey: 'test-key',
  },
};

/**
 * Mock history data
 */
export const mockHistory = {
  empty: [],
  singleEntry: [
    {
      id: '1',
      timestamp: '2024-01-20T10:00:00.000Z',
      transcription: 'create a function to add two numbers',
      language: 'javascript',
      result: 'function add(a, b) { return a + b; }',
      confidence: 0.95,
      duration: 2.5,
    },
  ],
  multipleEntries: [
    {
      id: '1',
      timestamp: '2024-01-20T10:00:00.000Z',
      transcription: 'create a function to add two numbers',
      language: 'javascript',
      result: 'function add(a, b) { return a + b; }',
      confidence: 0.95,
      duration: 2.5,
    },
    {
      id: '2',
      timestamp: '2024-01-20T10:05:00.000Z',
      transcription: 'command list all files',
      language: 'bash',
      result: 'ls -la',
      confidence: 0.92,
      duration: 1.8,
    },
    {
      id: '3',
      timestamp: '2024-01-20T10:10:00.000Z',
      transcription: 'python create a class for a person',
      language: 'python',
      result: 'class Person:\n    def __init__(self, name):\n        self.name = name',
      confidence: 0.88,
      duration: 3.2,
    },
  ],
};

/**
 * Mock transcription responses
 */
export const mockTranscriptions = {
  javascript: {
    text: 'create a function to add two numbers',
    confidence: 0.95,
    language: 'en',
  },
  python: {
    text: 'python create a class for a person',
    confidence: 0.88,
    language: 'en',
  },
  bash: {
    text: 'command list all files',
    confidence: 0.92,
    language: 'en',
  },
  typescript: {
    text: 'typescript define an interface for a user',
    confidence: 0.90,
    language: 'en',
  },
  hotkey: {
    text: 'hotkeys press control c',
    confidence: 0.93,
    language: 'en',
  },
  translate: {
    text: 'translate hello world to spanish',
    confidence: 0.91,
    language: 'en',
  },
  dito: {
    text: 'dito what is the weather today',
    confidence: 0.87,
    language: 'en',
  },
};

/**
 * Mock code generation results
 */
export const mockCodeResults = {
  javascript: 'function add(a, b) {\n  return a + b;\n}',
  python: 'class Person:\n    def __init__(self, name):\n        self.name = name',
  bash: 'ls -la',
  typescript: 'interface User {\n  id: number;\n  name: string;\n}',
  hotkey: 'Ctrl+C',
  translate: 'Hola Mundo',
  dito: 'I don\'t have access to real-time weather data.',
};

/**
 * Mock audio data (base64 encoded silence)
 */
export const mockAudioData = {
  silence: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
};

/**
 * Mock API responses
 */
export const mockAPIResponses = {
  groq: {
    transcription: {
      text: 'create a function to add two numbers',
      x_groq: { id: 'test-id' },
    },
    codeGeneration: {
      choices: [
        {
          message: {
            content: 'function add(a, b) { return a + b; }',
          },
        },
      ],
    },
  },
  assemblyai: {
    transcription: {
      id: 'test-id',
      status: 'completed',
      text: 'create a function to add two numbers',
      confidence: 0.95,
    },
  },
};

/**
 * Mock voice command detection results
 */
export const mockVoiceCommands = {
  javascript: {
    language: 'javascript',
    strippedTranscription: 'create a function to add two numbers',
  },
  python: {
    language: 'python',
    strippedTranscription: 'create a class for a person',
  },
  bash: {
    language: 'bash',
    strippedTranscription: 'list all files',
  },
  typescript: {
    language: 'typescript',
    strippedTranscription: 'define an interface for a user',
  },
  hotkey: {
    language: 'hotkey',
    strippedTranscription: 'press control c',
  },
  translate: {
    language: 'translate',
    strippedTranscription: 'hello world to spanish',
  },
  dito: {
    language: 'dito',
    strippedTranscription: 'what is the weather today',
  },
};

/**
 * Mock error responses
 */
export const mockErrors = {
  transcriptionError: {
    message: 'Failed to transcribe audio',
    code: 'TRANSCRIPTION_ERROR',
  },
  apiKeyMissing: {
    message: 'API key is required',
    code: 'API_KEY_MISSING',
  },
  networkError: {
    message: 'Network request failed',
    code: 'NETWORK_ERROR',
  },
  invalidAudio: {
    message: 'Invalid audio format',
    code: 'INVALID_AUDIO',
  },
};
