# AGENTS.md - Working Effectively in Ditossauro

This document provides comprehensive guidance for AI agents working in the Ditossauro codebase.

## Essential Commands

### Development
```bash
npm start              # Start development server and Electron app
npm run lint          # Run ESLint
npm run test          # Run Vitest tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI interface
npm run test:coverage # Run tests with coverage report
```

### Building & Packaging
```bash
npm run package       # Package app without making distribution
npm run build        # Same as npm run make
npm run make         # Create distribution packages
npm run publish      # Publish releases (requires setup)
```

### Versioning & Release
```bash
npm run version:patch  # Bump patch version (bug fixes)
npm run version:minor  # Bump minor version (new features)
npm run version:major  # Bump major version (breaking changes)
```

### Native Modules
```bash
npm run postinstall    # Rebuild native modules (robotjs, uiohook-napi)
npm run test:native   # Test native module integration
```

## Project Overview

**Ditossauro** is an Electron-based voice transcription desktop application that provides:
- Voice-to-text transcription using multiple providers (Groq, AssemblyAI, Faster Whisper)
- Code/command generation from voice commands
- Global hotkey support for hands-free operation
- Automatic text insertion into applications
- Multi-language support (English, Portuguese)

### Key Technologies
- **Electron 38** - Desktop framework
- **TypeScript** - Type-safe development
- **Vite** - Build tooling
- **Vitest** - Testing framework
- **Groq SDK** - Ultra-fast transcription & LLM
- **AssemblyAI SDK** - Alternative transcription provider
- **robotjs** - Cross-platform keyboard/mouse automation
- **uiohook-napi** - Global hotkey handling
- **i18next** - Internationalization

## Code Organization

### Main Process (`src/main.ts`)
- Entry point for Electron application
- Contains `DitossauroElectronApp` class managing:
  - Window creation and lifecycle
  - System tray integration
  - Global shortcuts
  - IPC communication setup
  - Web Audio Recorder injection

### Core Application Logic (`src/ditossauro-app.ts`)
- `DitossauroApp` class - Heart of the application
- Manages:
  - Recording state and audio processing
  - Transcription providers (factory pattern)
  - Settings management
  - Transcription history (last 50 sessions)
  - IPC handlers
  - Event emission for UI updates

### Services Layer
| Service | Purpose | Key Patterns |
|---------|---------|--------------|
| `assemblyai-client.ts` | AssemblyAI SDK integration | Lazy initialization, error handling, connection testing |
| `groq-client.ts` | Groq SDK for transcription | Client initialization, streaming support |
| `faster-whisper-client.ts` | Local Whisper transcription | Python subprocess management |
| `transcription-factory.ts` | Factory for transcription providers | Provider abstraction, type switching |
| `text-inserter.ts` | Automated text insertion | robotjs integration, clipboard handling |
| `settings-manager.ts` | JSON settings persistence | File I/O, default merging, migration |
| `history-manager.ts` | Transcription history storage | Array management, persistence |
| `hotkey-manager.ts` | Global hotkey handling | uiohook-napi integration |
| `hotkey-sender.ts` | Simulate keyboard events | robotjs key combinations |
| `voice-command-detector.ts` | Parse voice commands | Regex matching, keyword detection |
| `code-interpreter-factory.ts` | Factory for code interpreters | Language-specific instantiation |
| `audio-manager.ts` | Audio device management | Device enumeration, selection |

### Code Interpreters (`src/interpreters/`)
Each interpreter extends `BaseCodeInterpreter`:
- `bash-command-interpreter.ts` - Terminal commands
- `javascript-code-interpreter.ts` - JavaScript code
- `typescript-code-interpreter.ts` - TypeScript code
- `python-code-interpreter.ts` - Python code
- `hotkey-interpreter.ts` - Keyboard shortcuts
- `translate-interpreter.ts` - Text translation
- `dito-interpreter.ts` - General assistant

### Type Definitions (`src/types.ts`)
Centralized type definitions - **always use these**:
- `AppSettings` - Nested configuration structure
- `TranscriptionSession` - Transcription with metadata
- `RecordingState` - Current recording status
- `HotkeyConfig` - Hotkey with mode (toggle/push-to-talk)
- `CodeLanguage` - Supported code generation types
- `VoiceCommandResult` - Detected command with stripped text

### IPC Bridge (`src/preload.ts`)
Secure communication between main and renderer:
- `window.electronAPI.invoke()` - Async operations
- `window.electronAPI.send()` - Fire-and-forget events
- Event listeners with cleanup functions

### Renderer Process (`src/renderer.ts`)
Frontend UI with tab navigation:
- Recording interface
- Settings panel
- History view
- About section

### Configuration Files
- `forge.config.ts` - Electron Forge packaging config
- `vite.*.config.ts` - Vite build configs (main, preload, renderer, floating)
- `vitest.config.ts` - Test configuration with coverage thresholds
- `tsconfig.json` - TypeScript compiler options
- `.eslintrc.json` - Linting rules with import resolution

## Architecture Patterns

### Factory Pattern
Used for creating providers and interpreters:
```typescript
// Transcription providers
const provider = TranscriptionFactory.createProvider('groq', config);

// Code interpreters
const interpreter = CodeInterpreterFactory.createInterpreter('javascript', apiKey);
```

### EventEmitter Pattern
Core classes extend EventEmitter for state changes:
```typescript
class DitossauroApp extends EventEmitter {
  private notifyStateChange(eventName: string, data?: any): void {
    this.emit(eventName, data);
  }
}
```

### Lazy Initialization
API clients initialized only when configured:
```typescript
class ApiClient {
  private client: ExternalClient | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeClient();
  }

  private initializeClient(): void {
    if (this.apiKey && this.apiKey.trim()) {
      this.client = new ExternalClient({ apiKey: this.apiKey });
    }
  }
}
```

## TypeScript Patterns

### Always Use Centralized Types
```typescript
import { AppSettings, TranscriptionSession, RecordingState } from '@/types';
```

### Async/Await Over Promises
```typescript
// Good
async method(): Promise<ResultType> {
  try {
    const result = await asyncOperation();
    return result;
  } catch (error) {
    this.handleError(error);
    throw error;
  }
}

// Avoid
method(): Promise<ResultType> {
  return asyncOperation()
    .then(result => result)
    .catch(error => { /* ... */ });
}
```

### Settings Update Pattern
```typescript
updateSetting<K extends keyof AppSettings>(
  category: K,
  setting: Partial<AppSettings[K]>
): void {
  const currentSettings = this.loadSettings();
  currentSettings[category] = { ...currentSettings[category], ...setting };
  this.saveSettings(currentSettings);
}
```

### Console Logging with Emojis
```typescript
✅ Success operations
❌ Errors
⚠️ Warnings
🔄 Processing states
📦 Data operations
🎤 Audio operations
📝 Text operations
🤖 AI/LLM operations
```

## Electron Patterns

### Window Management
```typescript
createWindow(): void {
  this.mainWindow = new BrowserWindow({
    show: false, // Don't show initially
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Minimize to tray on close
  this.mainWindow.on('close', (event) => {
    if (!this.isQuitting) {
      event.preventDefault();
      this.mainWindow?.hide();
    }
  });

  this.mainWindow.on('ready-to-show', () => {
    this.mainWindow?.show();
  });
}
```

### Global Shortcuts
```typescript
setupGlobalShortcuts(): void {
  const success = globalShortcut.register('CommandOrControl+Shift+Meta', async () => {
    // Handler
  });

  if (!success) {
    console.error('Failed to register global shortcut');
  }
}

// Always cleanup
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

### Script Injection Pattern
Inject Web Audio Recorder into renderer:
```typescript
private injectScripts(): void {
  if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

  this.mainWindow.webContents.executeJavaScript(`
    class WebAudioRecorderRenderer {
      // Injected implementation
    }

    window.audioRecorder = new WebAudioRecorderRenderer();
  `).catch(console.error);
}
```

## IPC Communication Patterns

### Main Process Handlers
```typescript
private setupIPCHandlers(): void {
  // Async operations with invoke
  ipcMain.handle('get-settings', () => {
    return this.settingsManager.loadSettings();
  });

  // Fire-and-forget events
  ipcMain.on('audio-event', (_, eventType: string, data?: any) => {
    switch (eventType) {
      case 'recording-started':
        this.recordingState = { isRecording: true };
        this.emit('recording-started');
        break;
    }
  });
}
```

### Renderer API Usage
```typescript
// Async operations
const settings = await window.electronAPI.getSettings();
await window.electronAPI.updateSettings('api', { groqApiKey: '...' });

// Events
window.electronAPI.sendAudioEvent('recording-started');

// Event listeners
const cleanup = window.electronAPI.onRecordingStarted(() => {
  // Handle event
});
// Later: cleanup() to remove listener
```

### Preload Security
Always validate IPC channels in preload.ts:
```typescript
const electronAPI = {
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = ['get-settings', 'update-settings', ...];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  // ...
};
```

## Audio Processing Patterns

### Web Audio API Recording
```typescript
const audioConstraints = {
  audio: {
    sampleRate: 16000,        // Optimal for speech
    channelCount: 1,          // Mono is sufficient
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
};

const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
```

### Media Recorder Format Detection
```typescript
private getMediaRecorderOptions(): MediaRecorderOptions {
  const formats = [
    'audio/wav',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4'
  ];

  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) {
      return { mimeType: format };
    }
  }
  return {};
}
```

### Audio Format Detection (Main Process)
```typescript
private detectAudioFormat(buffer: Buffer): { extension: string; mimeType: string } {
  // WebM: 0x1A 0x45
  if (buffer[0] === 0x1A && buffer[1] === 0x45) {
    return { extension: '.webm', mimeType: 'audio/webm' };
  }
  // WAV: "RIFF"
  if (buffer.toString('ascii', 0, 4) === 'RIFF') {
    return { extension: '.wav', mimeType: 'audio/wav' };
  }
  // Default
  return { extension: '.webm', mimeType: 'audio/webm' };
}
```

### Audio Data Transfer
```typescript
// Renderer: Send to main
const audioBlob = new Blob(this.audioChunks, { type: mimeType });
const arrayBuffer = await audioBlob.arrayBuffer();
const uint8Array = new Uint8Array(arrayBuffer);

await window.electronAPI.processAudioData(
  Array.from(uint8Array),
  duration
);

// Main: Process
const buffer = Buffer.from(audioData);
const tempFile = this.createTempFile(buffer, extension);
// ...process...
this.cleanupTempFile(tempFile);
```

## API Integration Patterns

### Client Initialization
```typescript
export class ApiClient {
  private client: ExternalClient | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeClient();
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.initializeClient();
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey.trim().length > 0;
  }
}
```

### Error Handling
```typescript
async performApiOperation(): Promise<ResultType> {
  if (!this.client) {
    throw new Error('Client not initialized. Check API configuration.');
  }

  try {
    console.log('🚀 Starting API operation...');
    const result = await this.client.operation(params);

    if (result.status === 'error') {
      throw new Error(`API error: ${result.error || 'Unknown error'}`);
    }

    console.log('✅ API operation completed successfully!');
    return result;

  } catch (error) {
    console.error('❌ API operation failed:', error);

    // Transform technical errors into user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        throw new Error('Invalid API key. Check your configuration.');
      }
    }

    throw error;
  }
}
```

### Connection Testing
```typescript
async testConnection(): Promise<boolean> {
  if (!this.client) return false;

  try {
    console.log('🧪 Testing API connection...');
    await this.client.simpleOperation({ limit: 1 });
    console.log('✅ API connection working!');
    return true;
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
}
```

## Code Interpretation Patterns

### Base Interpreter
All interpreters extend `BaseCodeInterpreter`:
```typescript
export abstract class BaseCodeInterpreter {
  protected client: Groq | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
    }
  }

  protected abstract getSystemPrompt(): string;

  protected stripMarkdownCodeBlocks(text: string): string {
    let cleaned = text.replace(/^```\w*\s*\n?/gm, '');
    cleaned = cleaned.replace(/\n?```\s*$/gm, '');
    return cleaned.trim();
  }

  async interpretCode(transcribedText: string): Promise<string> {
    if (!this.client) throw new Error('Client not configured');

    const chatCompletion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: transcribedText }
      ],
      model: 'moonshotai/kimi-k2-instruct-0905',
      temperature: 0.6,
      max_completion_tokens: 4096,
    });

    return this.stripMarkdownCodeBlocks(chatCompletion.choices[0].message.content);
  }
}
```

### Voice Command Detection
```typescript
static detectCommand(transcription: string, locale: string): VoiceCommandResult {
  if (!transcription?.trim()) {
    return { language: 'javascript', strippedTranscription: '' };
  }

  const commandKeywords = this.getCommandKeywords(locale);

  for (const [language, keywords] of commandKeywords.entries()) {
    for (const keyword of keywords) {
      if (this.matchesKeyword(transcription, keyword)) {
        const stripped = this.stripCommandPrefix(transcription, keyword);
        return { language, strippedTranscription: stripped, detectedKeyword: keyword };
      }
    }
  }

  // Default to JavaScript if no command detected
  return { language: 'javascript', strippedTranscription: transcription.trim() };
}

private static matchesKeyword(transcription: string, keyword: string): boolean {
  const pattern = new RegExp(`^${keyword.toLowerCase()}\\b`, 'i');
  return pattern.test(transcription.toLowerCase());
}
```

## Testing Patterns

### Test Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClassName } from '@/class-name';

describe('ClassName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('method-name', () => {
    it('should do something when condition', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = className.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking File System
```typescript
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  // ...
}));

// In tests
vi.mocked(fs.existsSync).mockReturnValue(false);
vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(data));
```

### Mocking Electron & Native Modules
Global mocks are in `tests/setup.ts`:
```typescript
// Electron
vi.mock('electron', () => ({
  app: { getPath: vi.fn(), getName: vi.fn() },
  ipcMain: { handle: vi.fn(), on: vi.fn() },
  // ...
}));

// Native modules
vi.mock('robotjs', () => ({
  keyTap: vi.fn(),
  typeString: vi.fn(),
}));

vi.mock('uiohook-napi', () => ({
  uIOhook: { on: vi.fn(), start: vi.fn() },
}));
```

### Test Coverage Thresholds
In `vitest.config.ts`:
```typescript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60
  }
}
```

## i18n Patterns

### Locales Structure
- `src/locales/en.json` - English translations
- `src/locales/pt-BR.json` - Portuguese translations

### Accessing Translations
```typescript
// In main process
import { i18nMain } from './i18n-main';
const text = i18nMain.t('settings.title');

// In renderer (via window)
const text = window.i18n.t('settings.title');
```

### Voice Command Keywords
Keywords defined in locales:
```json
{
  "voiceCommands": {
    "keywords": {
      "command": "command",
      "javascript": "javascript",
      "typescript": "typescript",
      "python": "python",
      "hotkeys": "hotkeys",
      "translate": "translate",
      "dito": "dito|ditto"
    },
    "descriptions": {
      "command": "Generate bash/terminal commands",
      "javascript": "Generate JavaScript code",
      // ...
    }
  }
}
```

## Security Best Practices

### Electron Security
```typescript
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  nodeIntegration: false,      // Critical
  contextIsolation: true,       // Critical
  // Add CSP headers when possible
}
```

### IPC Channel Validation
Always whitelist IPC channels in preload.ts to prevent security issues.

### API Key Storage
- Store in `userData/settings.json`
- Never log API keys
- Validate key format before use

## Important Gotchas

### Native Modules (robotjs, uiohook-napi)
- Must be rebuilt for Electron: `npm run postinstall`
- Unpacked from asar in production (see forge.config.ts)
- Cannot be bundled - marked in `packagerConfig.asar.unpack`
- Fuses must disable `OnlyLoadAppFromAsar` for native modules

### TypeScript Path Aliases
```json
// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}

// Use in imports
import { Something } from '@/something';
```

### Hotkey Mode Handling
Two modes:
- `toggle`: Press once to start, press again to stop
- `push-to-talk`: Hold to record, release to stop (default)

### Multi-Window Setup
Two renderer windows:
- Main window: Primary UI
- Floating window: Quick status indicator
- Separate Vite configs for each

### Transcription Provider Switching
Factory pattern in `TranscriptionFactory`:
- Providers: `'assemblyai' | 'faster-whisper' | 'groq'`
- Default: `'groq'`
- Each provider implements `ITranscriptionProvider`

### Settings Migration
Old settings may use different formats (e.g., string hotkeys):
```typescript
// Migrate old string hotkey to HotkeyConfig
if (typeof settings.hotkeys.startStop === 'string') {
  startStopConfig = {
    keys: [settings.hotkeys.startStop],
    mode: 'toggle'
  };
}
```

### Buffer Handling for Audio
```typescript
// Convert array to buffer
const buffer = Buffer.from(audioData);

// Convert buffer to array
const arrayData = Array.from(buffer);

// Always validate
if (buffer.length === 0) {
  throw new Error('Empty audio buffer');
}
```

### Markdown Stripping
Code interpreters strip markdown code blocks:
```typescript
// Remove ```language and ``` wrappers
const cleaned = text.replace(/^```\w*\s*\n?/gm, '');
cleaned = cleaned.replace(/\n?```\s*$/gm, '');
```

## Build & Release

### Electron Forge Configuration
- Makers: Squirrel (Windows), ZIP (macOS), RPM, DEB (Linux)
- Plugins: Vite, AutoUnpackNatives, Fuses
- Native modules unpacked from asar

### Release Process
```bash
# 1. Bump version
npm run version:patch  # or minor/major

# 2. Commit and push
git add package.json
git commit -m "chore: bump version"
git push origin main

# 3. GitHub Actions automatically:
#    - Builds for all platforms
#    - Creates GitHub Release with tag
#    - Uploads installers
```

### Fuses Configuration
Security fuses applied at package time:
- `RunAsNode`: false
- `EnableCookieEncryption`: true
- `EnableNodeOptionsEnvironmentVariable`: false
- `EnableNodeCliInspectArguments`: false
- `OnlyLoadAppFromAsar`: false (critical for native modules)

## Workflow Guidelines

### Adding New Settings
1. Update `AppSettings` interface in `src/types.ts`
2. Add defaults in `settings-manager.ts`
3. Add IPC handler in `ditossauro-app.ts`
4. Update renderer UI to use new setting
5. Add translations to both locale files

### Adding New Recording Features
1. Extend Web Audio Recorder injection in `main.ts`
2. Add processing logic in `ditossauro-app.ts`
3. Follow audio processing patterns

### Adding New Code Interpreter
1. Extend `BaseCodeInterpreter` in new file
2. Add `CodeLanguage` type in `types.ts`
3. Register in `CodeInterpreterFactory`
4. Add keywords to locale files
5. VoiceCommandDetector automatically picks up keywords

### Adding New Transcription Provider
1. Implement `ITranscriptionProvider` interface
2. Create client class with error handling
3. Add to `TranscriptionFactory`
4. Update UI provider selection

### Debugging IPC Issues
- Add logging in both main and renderer
- Check channel names match exactly
- Verify preload script loaded
- Use DevTools to inspect renderer

### Testing Native Modules
- Run `npm run test:native` to verify integration
- Check rebuild after Electron version changes
- Verify modules are unpacked correctly in production

## Performance Considerations

### Audio Recording
- Use 16kHz sample rate (optimal for speech)
- Mono channel (stereo unnecessary)
- Collect chunks every 100ms
- Cleanup resources after recording

### Transcription
- Default to Groq (fastest)
- Use streaming when available
- Cache audio data efficiently
- Clean up temporary files

### Text Insertion
- Clipboard mode is faster than typing
- robotjs typeString for compatibility
- Handle insertion errors gracefully

## Platform-Specific Notes

### Windows
- Default hotkey: `Ctrl+Win` (Meta key)
- Squirrel installer for updates
- Native modules require Visual Studio Build Tools

### macOS
- Cmd key instead of Win
- Keep running when windows closed
- Code signing for distribution

### Linux
- Package formats: .deb, .rpm
- Different key codes for some keys
- AppImage alternative possible

## Common Tasks & Solutions

### Hotkey Not Working
1. Check hotkey registration in logs
2. Verify uiohook-napi is properly built
3. Test different key combinations
4. Check for conflicts with other apps

### Audio Not Recording
1. Verify microphone permissions
2. Check Web Audio API console logs
3. Test with different audio devices
4. Ensure sample rate is supported

### Transcription Failing
1. Verify API key is configured
2. Test API connection in settings
3. Check API quota/credits
4. Review error logs for specific issues

### Native Module Errors
1. Run `npm run postinstall`
2. Rebuild: `npm run build`
3. Check build tools are installed
4. Verify Electron version compatibility

## Summary

This codebase follows clean architecture patterns with:
- Clear separation of concerns (main/renderer/services)
- Strong TypeScript typing throughout
- Comprehensive error handling
- Extensive test coverage
- Multi-platform support
- Internationalization support

Key areas to pay attention to:
1. **Native modules** - Require rebuild and unpacking
2. **IPC security** - Always validate channels
3. **Type safety** - Use centralized types
4. **Error handling** - Transform for user-friendly messages
5. **i18n** - Always add translations for new strings
6. **Testing** - Mock Electron/native modules properly
7. **Build** - Fuses and native module unpacking critical

When in doubt, reference existing implementations in similar services and follow established patterns.
