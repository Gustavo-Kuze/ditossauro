import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppSettings } from './types';

export class SettingsManager {
  private settingsPath: string;
  private defaultSettings: AppSettings = {
    locale: 'pt-BR', // Default to Brazilian Portuguese
    hotkeys: {
      startStop: {
        keys: ['Control', 'Meta'], // Control + Windows (Meta)
        mode: 'push-to-talk'
      },
      codeSnippet: {
        keys: ['Control', 'Shift', 'Meta'], // Control + Shift + Windows (Meta)
        mode: 'push-to-talk'
      },
      cancel: 'Escape'
    },
    audio: {
      deviceId: 'default',
      sampleRate: 16000
    },
    api: {
      assemblyAiKey: process.env.ASSEMBLYAI_API_KEY || '',
      groqApiKey: process.env.GROQ_API_KEY || '',
      zaiApiKey: process.env.ZAI_API_KEY || '',
      language: 'pt'
    },
    transcription: {
      provider: 'groq' as const,
      groq: {
        modelName: 'whisper-large-v3' as const,
        language: '' // Empty for auto-detect
      }
    },
    codeGeneration: {
      provider: 'groq' as const,
      groq: {
        model: 'moonshotai/kimi-k2-instruct-0905'
      },
      zai: {
        model: 'GLM-4.7' as const,
        temperature: 1.0,
        maxTokens: 4096
      }
    },
    behavior: {
      autoInsert: true,
      showConfirmation: false,
      useClipboard: true,
      startMinimized: false
    }
  };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.ensureSettingsFileExists();
  }

  private ensureSettingsFileExists(): void {
    if (!fs.existsSync(this.settingsPath)) {
      this.saveSettings(this.defaultSettings);
    }
  }

  loadSettings(): AppSettings {
    try {
      const settingsData = fs.readFileSync(this.settingsPath, 'utf8');
      const settings = JSON.parse(settingsData) as any;

      // Migrate old settings (startStop as string) to new format
      let startStopConfig = this.defaultSettings.hotkeys.startStop;
      if (settings.hotkeys?.startStop) {
        if (typeof settings.hotkeys.startStop === 'string') {
          // Old format: convert to new format in toggle mode
          startStopConfig = {
            keys: [settings.hotkeys.startStop],
            mode: 'toggle' as const
          };
        } else {
          startStopConfig = settings.hotkeys.startStop;
        }
      }

      // Ensure codeSnippet exists
      const codeSnippetConfig = settings.hotkeys?.codeSnippet || this.defaultSettings.hotkeys.codeSnippet;

      // Merge with default settings to ensure all properties exist
      return {
        ...this.defaultSettings,
        ...settings,
        hotkeys: {
          ...this.defaultSettings.hotkeys,
          ...settings.hotkeys,
          startStop: startStopConfig,
          codeSnippet: codeSnippetConfig
        },
        audio: { ...this.defaultSettings.audio, ...settings.audio },
        api: { ...this.defaultSettings.api, ...settings.api },
        transcription: {
          ...this.defaultSettings.transcription,
          ...settings.transcription,
          groq: {
            ...this.defaultSettings.transcription.groq,
            ...(settings.transcription?.groq || {})
          }
        },
        codeGeneration: {
          ...this.defaultSettings.codeGeneration,
          ...settings.codeGeneration,
          groq: {
            ...this.defaultSettings.codeGeneration.groq,
            ...(settings.codeGeneration?.groq || {})
          },
          zai: {
            ...this.defaultSettings.codeGeneration.zai,
            ...(settings.codeGeneration?.zai || {})
          }
        },
        behavior: { ...this.defaultSettings.behavior, ...settings.behavior }
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.defaultSettings;
    }
  }

  saveSettings(settings: AppSettings): void {
    try {
      const settingsData = JSON.stringify(settings, null, 2);
      fs.writeFileSync(this.settingsPath, settingsData, 'utf8');
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  updateSetting<K extends keyof AppSettings>(category: K, setting: Partial<AppSettings[K]>): void {
    const currentSettings = this.loadSettings();

    // Handle locale separately since it's a string, not an object
    if (category === 'locale') {
      const val = setting as any;
      if (typeof val === 'object' && val !== null && 'locale' in val) {
        currentSettings[category] = val.locale;
      } else {
        currentSettings[category] = val;
      }
    } else {
      currentSettings[category] = { ...(currentSettings[category] as object), ...(setting as object) } as AppSettings[K];
    }

    this.saveSettings(currentSettings);
  }

  resetToDefaults(): void {
    this.saveSettings(this.defaultSettings);
  }

  getSettingsPath(): string {
    return this.settingsPath;
  }

  backupSettings(): string {
    const backupPath = this.settingsPath + '.backup.' + Date.now();
    fs.copyFileSync(this.settingsPath, backupPath);
    return backupPath;
  }
}
