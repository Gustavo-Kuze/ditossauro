import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextInserter } from '@/text-inserter';
import * as robot from 'robotjs';
import { clipboard } from 'electron';

describe('TextInserter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('insertText - clipboard mode', () => {
    it('should insert text via clipboard by default', async () => {
      const text = 'Hello, World!';
      vi.mocked(clipboard.readText).mockReturnValue('original clipboard');

      await TextInserter.insertText(text);

      // Should read original clipboard
      expect(clipboard.readText).toHaveBeenCalled();

      // Should write new text to clipboard
      expect(clipboard.writeText).toHaveBeenCalledWith(text);

      // Should paste with Ctrl+V
      expect(robot.keyTap).toHaveBeenCalledWith('v', 'control');
    });

    it('should use clipboard mode when useClipboard is true', async () => {
      const text = 'Test text';
      const settings = {
        behavior: {
          useClipboard: true,
          autoInsert: true,
          showConfirmation: false,
          startMinimized: false
        }
      } as any;

      await TextInserter.insertText(text, 'append', settings);

      expect(clipboard.writeText).toHaveBeenCalledWith(text);
      expect(robot.keyTap).toHaveBeenCalledWith('v', 'control');
    });

    it('should select all before pasting in replace mode', async () => {
      const text = 'Replace this';

      await TextInserter.insertText(text, 'replace');

      // Should select all with Ctrl+A
      expect(robot.keyTap).toHaveBeenCalledWith('a', 'control');

      // Should paste
      expect(robot.keyTap).toHaveBeenCalledWith('v', 'control');
    });

    it('should not select all in append mode', async () => {
      const text = 'Append this';
      vi.clearAllMocks();

      await TextInserter.insertText(text, 'append');

      // Should NOT call Ctrl+A (select all)
      const selectAllCalls = vi.mocked(robot.keyTap).mock.calls.filter(
        call => call[0] === 'a' && call[1] === 'control'
      );
      expect(selectAllCalls.length).toBe(0);

      // Should still paste
      expect(robot.keyTap).toHaveBeenCalledWith('v', 'control');
    });

    it('should restore original clipboard content', async () => {
      const originalClipboard = 'original content';
      const newText = 'new content';

      vi.mocked(clipboard.readText).mockReturnValue(originalClipboard);
      vi.useFakeTimers();

      const promise = TextInserter.insertText(newText);
      await vi.runAllTimersAsync();
      await promise;

      // Fast-forward timers to trigger clipboard restore
      await vi.advanceTimersByTimeAsync(250);

      // Should restore original clipboard after delay
      expect(clipboard.writeText).toHaveBeenCalledWith(originalClipboard);

      vi.useRealTimers();
    });

    it('should handle clipboard read errors gracefully', async () => {
      const text = 'Test text';
      vi.mocked(clipboard.readText).mockImplementation(() => {
        throw new Error('Clipboard read error');
      });

      vi.useFakeTimers();
      const promise = TextInserter.insertText(text);
      await vi.runAllTimersAsync();
      await promise;
      vi.useRealTimers();

      // Should still attempt to paste
      expect(robot.keyTap).toHaveBeenCalledWith('v', 'control');
    });
  });

  describe('insertText - typing mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should use typing mode when useClipboard is false', async () => {
      const text = 'Type this';
      const settings = {
        behavior: {
          useClipboard: false,
          autoInsert: true,
          showConfirmation: false,
          startMinimized: false
        }
      } as any;

      const promise = TextInserter.insertText(text, 'append', settings);
      await vi.runAllTimersAsync();
      await promise;

      // Should type the text
      expect(robot.typeString).toHaveBeenCalled();

      // Should NOT use clipboard
      expect(clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should type text word by word', async () => {
      const text = 'Hello World Test';
      const settings = {
        behavior: {
          useClipboard: false,
          autoInsert: true,
          showConfirmation: false,
          startMinimized: false
        }
      } as any;

      const promise = TextInserter.insertText(text, 'append', settings);
      await vi.runAllTimersAsync();
      await promise;

      // Should type each word
      expect(robot.typeString).toHaveBeenCalledWith('Hello');
      expect(robot.typeString).toHaveBeenCalledWith('World');
      expect(robot.typeString).toHaveBeenCalledWith('Test');

      // Should type spaces between words
      expect(robot.typeString).toHaveBeenCalledWith(' ');
    });

    it('should select all before typing in replace mode', async () => {
      const text = 'Replace text';
      const settings = {
        behavior: {
          useClipboard: false,
          autoInsert: true,
          showConfirmation: false,
          startMinimized: false
        }
      } as any;

      const promise = TextInserter.insertText(text, 'replace', settings);
      await vi.runAllTimersAsync();
      await promise;

      // Should select all
      expect(robot.keyTap).toHaveBeenCalledWith('a', 'control');

      // Then type
      expect(robot.typeString).toHaveBeenCalled();
    });

    it('should fallback to typing if clipboard insertion fails', async () => {
      const text = 'Fallback test';

      // Make clipboard operations fail
      vi.mocked(robot.keyTap).mockImplementation((key: string) => {
        if (key === 'v') {
          throw new Error('Paste failed');
        }
      });

      const promise = TextInserter.insertText(text);
      await vi.runAllTimersAsync();
      await promise;

      // Should attempt typing as fallback
      expect(robot.typeString).toHaveBeenCalled();
    });
  });

  describe('simulateKeyPress', () => {
    it('should simulate key press without modifiers', async () => {
      await TextInserter.simulateKeyPress('Enter');

      expect(robot.keyTap).toHaveBeenCalledWith('Enter');
    });

    it('should simulate key press with single modifier', async () => {
      await TextInserter.simulateKeyPress('c', ['control']);

      expect(robot.keyTap).toHaveBeenCalledWith('c', ['control']);
    });

    it('should simulate key press with multiple modifiers', async () => {
      await TextInserter.simulateKeyPress('s', ['control', 'shift']);

      expect(robot.keyTap).toHaveBeenCalledWith('s', ['control', 'shift']);
    });

    it('should throw error if robotjs fails', async () => {
      vi.mocked(robot.keyTap).mockImplementation(() => {
        throw new Error('Key press failed');
      });

      await expect(TextInserter.simulateKeyPress('x')).rejects.toThrow('Key press failed');
    });
  });

  describe('getMousePosition', () => {
    it('should return mouse position', () => {
      const mockPosition = { x: 100, y: 200 };
      vi.mocked(robot.getMousePos).mockReturnValue(mockPosition);

      const position = TextInserter.getMousePosition();

      expect(position).toEqual(mockPosition);
      expect(robot.getMousePos).toHaveBeenCalled();
    });

    it('should return coordinates with x and y properties', () => {
      vi.mocked(robot.getMousePos).mockReturnValue({ x: 50, y: 75 });

      const position = TextInserter.getMousePosition();

      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
    });
  });

  describe('clickAtPosition', () => {
    it('should move mouse and click at specified position', () => {
      TextInserter.clickAtPosition(150, 250);

      expect(robot.moveMouse).toHaveBeenCalledWith(150, 250);
      expect(robot.mouseClick).toHaveBeenCalled();
    });

    it('should move mouse before clicking', () => {
      const calls: string[] = [];

      vi.mocked(robot.moveMouse).mockImplementation(() => {
        calls.push('move');
      });

      vi.mocked(robot.mouseClick).mockImplementation(() => {
        calls.push('click');
      });

      TextInserter.clickAtPosition(100, 200);

      // Move should happen before click
      expect(calls).toEqual(['move', 'click']);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should handle empty string', async () => {
      const promise = TextInserter.insertText('');
      await vi.runAllTimersAsync();
      await promise;

      expect(clipboard.writeText).toHaveBeenCalledWith('');
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);

      const promise = TextInserter.insertText(longText);
      await vi.runAllTimersAsync();
      await promise;

      expect(clipboard.writeText).toHaveBeenCalledWith(longText);
    });

    it('should handle text with special characters', async () => {
      const specialText = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./\n\t';

      const promise = TextInserter.insertText(specialText);
      await vi.runAllTimersAsync();
      await promise;

      expect(clipboard.writeText).toHaveBeenCalledWith(specialText);
    });

    it('should handle text with unicode characters', async () => {
      const unicodeText = 'Hello 世界 🌍 Olá';

      const promise = TextInserter.insertText(unicodeText);
      await vi.runAllTimersAsync();
      await promise;

      expect(clipboard.writeText).toHaveBeenCalledWith(unicodeText);
    });
  });
});
