import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryManager } from '@/history-manager';
import * as fs from 'fs';
import path from 'path';
import { TranscriptionSession } from '@/types';

// Mock fs module - HistoryManager uses "import * as fs from 'fs'" (namespace import)
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => '[]'),
  writeFileSync: vi.fn(),
}));

describe('HistoryManager', () => {
  let historyManager: HistoryManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: file exists with empty array
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('[]');
    vi.mocked(fs.writeFileSync).mockImplementation(() => {});

    historyManager = new HistoryManager();
  });

  describe('constructor and initialization', () => {
    it('should create history file if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const newManager = new HistoryManager();

      // Should attempt to write empty array
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should not create history file if it already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockClear();

      const newManager = new HistoryManager();

      // Should not write if file exists
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should set history path in userData directory', () => {
      const historyPath = historyManager.getHistoryPath();

      expect(historyPath).toContain('history.json');
      expect(historyPath).toContain('mock'); // From mocked app.getPath
    });
  });

  describe('loadHistory', () => {
    it('should return empty array when file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const history = historyManager.loadHistory();

      expect(history).toEqual([]);
    });

    it('should return empty array when file contains empty array', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('[]');

      const history = historyManager.loadHistory();

      expect(history).toEqual([]);
    });

    it('should load and parse history sessions from file', () => {
      const mockSessions = [
        {
          id: 'session-1',
          transcription: 'Hello world',
          timestamp: '2024-01-15T10:30:00.000Z',
          language: 'en',
          duration: 1500
        },
        {
          id: 'session-2',
          transcription: 'Test session',
          timestamp: '2024-01-15T11:00:00.000Z',
          language: 'en',
          duration: 2000
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSessions));

      const history = historyManager.loadHistory();

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('session-1');
      expect(history[0].transcription).toBe('Hello world');
      expect(history[1].id).toBe('session-2');
    });

    it('should convert timestamp strings to Date objects', () => {
      const mockSessions = [
        {
          id: 'session-1',
          transcription: 'Test',
          timestamp: '2024-01-15T10:30:00.000Z',
          language: 'en',
          duration: 1000
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSessions));

      const history = historyManager.loadHistory();

      expect(history[0].timestamp).toBeInstanceOf(Date);
      expect(history[0].timestamp.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle file read errors gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File read error');
      });

      const history = historyManager.loadHistory();

      // Should return empty array on error
      expect(history).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

      const history = historyManager.loadHistory();

      // Should return empty array on parse error
      expect(history).toEqual([]);
    });

    it('should handle corrupted session data gracefully', () => {
      const corruptedData = [
        {
          id: 'session-1',
          // Missing required fields
        }
      ];

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(corruptedData));

      const history = historyManager.loadHistory();

      // Should still load, but with partial data
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('session-1');
    });
  });

  describe('saveHistory', () => {
    it('should write history array to file as JSON', () => {
      const sessions: TranscriptionSession[] = [
        {
          id: 'session-1',
          transcription: 'Test transcription',
          timestamp: new Date('2024-01-15T10:30:00.000Z'),
          language: 'en',
          duration: 1500
        }
      ];

      vi.mocked(fs.writeFileSync).mockClear();

      historyManager.saveHistory(sessions);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(writeCall[0]).toContain('history.json');

      const writtenData = writeCall[1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('session-1');
      expect(parsed[0].transcription).toBe('Test transcription');
    });

    it('should write empty array when given empty history', () => {
      vi.mocked(fs.writeFileSync).mockClear();

      historyManager.saveHistory([]);

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = writeCall[1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed).toEqual([]);
    });

    it('should format JSON with indentation', () => {
      const sessions: TranscriptionSession[] = [
        {
          id: 'session-1',
          transcription: 'Test',
          timestamp: new Date(),
          language: 'en',
          duration: 1000
        }
      ];

      vi.mocked(fs.writeFileSync).mockClear();

      historyManager.saveHistory(sessions);

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = writeCall[1] as string;

      // Should have newlines (formatted with 2-space indent)
      expect(writtenData).toContain('\n');
      expect(writtenData).toContain('  '); // 2-space indent
    });

    it('should throw error if write fails', () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => {
        historyManager.saveHistory([]);
      }).toThrow('Write failed');
    });

    it('should save multiple sessions correctly', () => {
      const sessions: TranscriptionSession[] = [
        {
          id: 'session-1',
          transcription: 'First',
          timestamp: new Date('2024-01-15T10:00:00.000Z'),
          language: 'en',
          duration: 1000
        },
        {
          id: 'session-2',
          transcription: 'Second',
          timestamp: new Date('2024-01-15T11:00:00.000Z'),
          language: 'pt',
          duration: 2000
        },
        {
          id: 'session-3',
          transcription: 'Third',
          timestamp: new Date('2024-01-15T12:00:00.000Z'),
          language: 'en',
          duration: 1500
        }
      ];

      vi.mocked(fs.writeFileSync).mockClear();

      historyManager.saveHistory(sessions);

      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = writeCall[1] as string;
      const parsed = JSON.parse(writtenData);

      expect(parsed).toHaveLength(3);
      expect(parsed[0].id).toBe('session-1');
      expect(parsed[1].id).toBe('session-2');
      expect(parsed[2].id).toBe('session-3');
    });
  });

  describe('clearHistory', () => {
    it('should write empty array to history file', () => {
      vi.mocked(fs.writeFileSync).mockClear();

      historyManager.clearHistory();

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = writeCall[1] as string;
      const parsed = JSON.parse(writtenData);
      expect(parsed).toEqual([]);
    });

    it('should clear existing history', () => {
      // Set up existing history
      const existingSessions = [
        {
          id: 'session-1',
          transcription: 'Test',
          timestamp: '2024-01-15T10:00:00.000Z',
          language: 'en',
          duration: 1000
        }
      ];
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingSessions));

      // Verify history exists
      let history = historyManager.loadHistory();
      expect(history).toHaveLength(1);

      // Clear and update mock to return empty
      vi.mocked(fs.writeFileSync).mockClear();
      historyManager.clearHistory();

      // Verify clear was called
      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = writeCall[1] as string;
      expect(JSON.parse(writtenData)).toEqual([]);
    });
  });

  describe('getHistoryPath', () => {
    it('should return the history file path', () => {
      const historyPath = historyManager.getHistoryPath();

      expect(historyPath).toBeDefined();
      expect(typeof historyPath).toBe('string');
      expect(historyPath).toContain('history.json');
    });

    it('should return consistent path across multiple calls', () => {
      const path1 = historyManager.getHistoryPath();
      const path2 = historyManager.getHistoryPath();

      expect(path1).toBe(path2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle save and load cycle', () => {
      const originalSessions: TranscriptionSession[] = [
        {
          id: 'test-1',
          transcription: 'Integration test',
          timestamp: new Date('2024-01-15T10:00:00.000Z'),
          language: 'en',
          duration: 2500
        }
      ];

      // Save
      historyManager.saveHistory(originalSessions);

      // Get what was written
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      const writtenData = writeCall[1] as string;

      // Mock read to return what was written
      vi.mocked(fs.readFileSync).mockReturnValue(writtenData);

      // Load
      const loadedSessions = historyManager.loadHistory();

      expect(loadedSessions).toHaveLength(1);
      expect(loadedSessions[0].id).toBe('test-1');
      expect(loadedSessions[0].transcription).toBe('Integration test');
      expect(loadedSessions[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty history lifecycle', () => {
      // Start with empty
      vi.mocked(fs.readFileSync).mockReturnValue('[]');
      let history = historyManager.loadHistory();
      expect(history).toEqual([]);

      // Add sessions
      const newSessions: TranscriptionSession[] = [
        {
          id: 'new-1',
          transcription: 'New session',
          timestamp: new Date(),
          language: 'en',
          duration: 1000
        }
      ];
      historyManager.saveHistory(newSessions);

      // Mock updated data
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0];
      vi.mocked(fs.readFileSync).mockReturnValue(writeCall[1] as string);

      // Verify loaded
      history = historyManager.loadHistory();
      expect(history).toHaveLength(1);

      // Clear
      historyManager.clearHistory();

      // Verify cleared
      const clearCall = vi.mocked(fs.writeFileSync).mock.calls[1];
      expect(JSON.parse(clearCall[1] as string)).toEqual([]);
    });
  });
});
