import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from '@/settings-manager';
import * as fs from 'fs';

// Mock fs module - SettingsManager uses "import * as fs from 'fs'"
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '{}'),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  copyFileSync: vi.fn(),
}));

describe('SettingsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: file exists with empty object
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
    vi.mocked(fs.mkdirSync).mockImplementation(() => '');
    vi.mocked(fs.copyFileSync).mockImplementation(() => undefined);
  });

  describe('constructor and initialization', () => {
    it('should create settings file if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockClear();

      const manager = new SettingsManager();

      // Should call writeFileSync to create the file with defaults
      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData.locale).toBe('pt-BR');
    });

    it('should not create settings file if it already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');
      vi.mocked(fs.writeFileSync).mockClear();

      const manager = new SettingsManager();

      // Constructor should not write if file exists
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('loadSettings', () => {
    it('should return default settings when reading empty file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      expect(settings.locale).toBe('pt-BR');
      expect(settings.hotkeys.startStop.keys).toEqual(['Control', 'Meta']);
      expect(settings.hotkeys.startStop.mode).toBe('push-to-talk');
      expect(settings.hotkeys.codeSnippet.keys).toEqual(['Control', 'Shift', 'Meta']);
    });

    it('should load existing settings from JSON file', () => {
      const savedSettings = {
        locale: 'en',
        hotkeys: {
          startStop: {
            keys: ['Alt', 'S'],
            mode: 'toggle'
          },
          codeSnippet: {
            keys: ['Alt', 'Shift', 'C'],
            mode: 'toggle'
          },
          cancel: 'Escape'
        },
        api: {
          assemblyAiKey: '',
          groqApiKey: 'test-groq-key',
          language: 'en'
        }
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(savedSettings));

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      expect(settings.locale).toBe('en');
      expect(settings.hotkeys.startStop.keys).toEqual(['Alt', 'S']);
      expect(settings.hotkeys.startStop.mode).toBe('toggle');
      expect(settings.api.groqApiKey).toBe('test-groq-key');
    });

    it('should migrate old string hotkey format to HotkeyConfig', () => {
      const oldFormat = {
        hotkeys: {
          startStop: 'Control'  // Old string format
        }
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(oldFormat));

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      // Should convert to new format with toggle mode
      expect(settings.hotkeys.startStop).toEqual({
        keys: ['Control'],
        mode: 'toggle'
      });
    });

    it('should handle file read errors gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File read error');
      });

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      // Should return defaults on error
      expect(settings.locale).toBe('pt-BR');
      expect(settings.hotkeys.startStop.keys).toEqual(['Control', 'Meta']);
    });

    it('should handle invalid JSON gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      // Should return defaults on parse error
      expect(settings.locale).toBe('pt-BR');
    });

    it('should merge partial settings with defaults', () => {
      const partialSettings = {
        locale: 'en',
        api: {
          groqApiKey: 'my-key'
          // Other api fields missing - should come from defaults
        }
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(partialSettings));

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      // Custom values
      expect(settings.locale).toBe('en');
      expect(settings.api.groqApiKey).toBe('my-key');
      // Default values (merged in)
      expect(settings.api.assemblyAiKey).toBe('');
      expect(settings.api.language).toBe('pt');
      expect(settings.hotkeys.startStop.keys).toEqual(['Control', 'Meta']);
    });
  });

  describe('saveSettings', () => {
    it('should write settings to file as JSON', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      vi.mocked(fs.writeFileSync).mockClear();
      manager.saveSettings(settings);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = JSON.parse(writeCall[1] as string);
      expect(writtenData.locale).toBe('pt-BR');
    });

    it('should throw error when write fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const manager = new SettingsManager();
      const settings = manager.loadSettings();

      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write error');
      });

      // Should throw the error
      expect(() => manager.saveSettings(settings)).toThrow('Write error');
    });
  });

  describe('updateSetting', () => {
    it('should update nested setting without overwriting siblings', () => {
      const existingSettings = {
        locale: 'pt-BR',
        api: {
          assemblyAiKey: 'existing-key',
          groqApiKey: '',
          language: 'pt'
        }
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingSettings));

      const manager = new SettingsManager();

      vi.mocked(fs.writeFileSync).mockClear();
      manager.updateSetting('api', { groqApiKey: 'new-key' });

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);

      expect(savedData.api.groqApiKey).toBe('new-key');
      expect(savedData.api.assemblyAiKey).toBe('existing-key'); // Not overwritten
      expect(savedData.api.language).toBe('pt'); // Not overwritten
    });

    it('should update top-level setting', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const manager = new SettingsManager();

      vi.mocked(fs.writeFileSync).mockClear();
      manager.updateSetting('locale', 'en' as any);

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData.locale).toBe('en');
    });

    it('should update deeply nested transcription settings', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const manager = new SettingsManager();

      vi.mocked(fs.writeFileSync).mockClear();
      manager.updateSetting('transcription', { provider: 'assemblyai' as const });

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);
      expect(savedData.transcription.provider).toBe('assemblyai');
      // Other transcription settings should remain from defaults
      expect(savedData.transcription.groq).toBeDefined();
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to default values', () => {
      const modifiedSettings = {
        locale: 'en',
        api: {
          groqApiKey: 'custom-key',
          assemblyAiKey: 'test-key',
          language: 'en'
        }
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(modifiedSettings));

      const manager = new SettingsManager();

      vi.mocked(fs.writeFileSync).mockClear();
      manager.resetToDefaults();

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const savedData = JSON.parse(writeCall[1] as string);

      expect(savedData.locale).toBe('pt-BR'); // Default
      expect(savedData.api.groqApiKey).toBe(''); // Default
      expect(savedData.api.language).toBe('pt'); // Default
    });
  });

  describe('backupSettings', () => {
    it('should create a backup file with timestamp', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const manager = new SettingsManager();

      vi.mocked(fs.copyFileSync).mockClear();
      manager.backupSettings();

      expect(fs.copyFileSync).toHaveBeenCalled();
      const copyCall = vi.mocked(fs.copyFileSync).mock.calls[0];

      const sourcePath = copyCall[0] as string;
      const backupPath = copyCall[1] as string;

      expect(sourcePath).toContain('settings.json');
      expect(backupPath).toContain('settings.json.backup');
      expect(backupPath).toMatch(/\d+/); // Should contain timestamp
    });
  });
});
