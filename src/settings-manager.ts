import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppSettings } from './types';

export class SettingsManager {
  private settingsPath: string;
  private defaultSettings: AppSettings = {
    hotkeys: {
      startStop: 'F2',
      cancel: 'Escape'
    },
    audio: {
      deviceId: 'default',
      sampleRate: 16000
    },
    api: {
      assemblyAiKey: process.env.ASSEMBLYAI_API_KEY || '',
      language: 'pt'
    },
    transcription: {
      provider: 'assemblyai' as const,
      fasterWhisper: {
        modelSize: 'base' as const,
        device: 'cpu' as const,
        computeType: 'int8' as const,
        pythonPath: 'python'
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
      const settings = JSON.parse(settingsData) as AppSettings;
      
      // Mesclar com configurações padrão para garantir que todas as propriedades existam
      return {
        ...this.defaultSettings,
        ...settings,
        hotkeys: { ...this.defaultSettings.hotkeys, ...settings.hotkeys },
        audio: { ...this.defaultSettings.audio, ...settings.audio },
        api: { ...this.defaultSettings.api, ...settings.api },
        transcription: { 
          ...this.defaultSettings.transcription, 
          ...settings.transcription,
          fasterWhisper: { 
            ...this.defaultSettings.transcription.fasterWhisper, 
            ...(settings.transcription?.fasterWhisper || {}) 
          }
        },
        behavior: { ...this.defaultSettings.behavior, ...settings.behavior }
      };
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return this.defaultSettings;
    }
  }

  saveSettings(settings: AppSettings): void {
    try {
      const settingsData = JSON.stringify(settings, null, 2);
      fs.writeFileSync(this.settingsPath, settingsData, 'utf8');
      console.log('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  updateSetting<K extends keyof AppSettings>(category: K, setting: Partial<AppSettings[K]>): void {
    const currentSettings = this.loadSettings();
    currentSettings[category] = { ...currentSettings[category], ...setting };
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
