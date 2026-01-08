import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HotkeySender, HotkeyCombination } from '@/hotkey-sender';
import * as robot from 'robotjs';

// Mock robotjs
vi.mock('robotjs', () => ({
  keyTap: vi.fn(),
  default: {
    keyTap: vi.fn(),
  }
}));

describe('HotkeySender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseHotkeys', () => {
    it('should parse simple key without modifiers', () => {
      const result = HotkeySender.parseHotkeys('f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: [], key: 'f' });
    });

    it('should parse key with one modifier', () => {
      const result = HotkeySender.parseHotkeys('control f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control'], key: 'f' });
    });

    it('should parse key with multiple modifiers', () => {
      const result = HotkeySender.parseHotkeys('control shift f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift'], key: 'f' });
    });

    it('should parse key with three modifiers', () => {
      const result = HotkeySender.parseHotkeys('control shift alt f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift', 'alt'], key: 'f' });
    });

    it('should parse alt tab combination', () => {
      const result = HotkeySender.parseHotkeys('alt tab');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['alt'], key: 'tab' });
    });

    it('should parse control c combination', () => {
      const result = HotkeySender.parseHotkeys('control c');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control'], key: 'c' });
    });

    it('should parse escape key', () => {
      const result = HotkeySender.parseHotkeys('escape');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: [], key: 'escape' });
    });

    it('should parse function key', () => {
      const result = HotkeySender.parseHotkeys('f5');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: [], key: 'f5' });
    });

    it('should parse function key with modifiers', () => {
      const result = HotkeySender.parseHotkeys('control shift f12');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift'], key: 'f12' });
    });

    it('should parse number key', () => {
      const result = HotkeySender.parseHotkeys('5');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: [], key: '5' });
    });

    it('should parse number key with modifiers', () => {
      const result = HotkeySender.parseHotkeys('control 5');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control'], key: '5' });
    });

    it('should normalize ctrl to control', () => {
      const result = HotkeySender.parseHotkeys('ctrl f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control'], key: 'f' });
    });

    it('should normalize win to meta', () => {
      const result = HotkeySender.parseHotkeys('win f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['meta'], key: 'f' });
    });

    it('should normalize cmd to meta', () => {
      const result = HotkeySender.parseHotkeys('cmd f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['meta'], key: 'f' });
    });

    it('should handle extra spaces', () => {
      const result = HotkeySender.parseHotkeys('control   shift   f');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift'], key: 'f' });
    });

    it('should handle leading/trailing spaces', () => {
      const result = HotkeySender.parseHotkeys('  control shift f  ');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift'], key: 'f' });
    });

    it('should handle uppercase input', () => {
      const result = HotkeySender.parseHotkeys('CONTROL SHIFT F');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift'], key: 'f' });
    });

    it('should reject empty string', () => {
      const result = HotkeySender.parseHotkeys('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Hotkey string is empty');
    });

    it('should reject whitespace-only string', () => {
      const result = HotkeySender.parseHotkeys('   ');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Hotkey string is empty');
    });

    it('should reject only modifiers without main key', () => {
      const result = HotkeySender.parseHotkeys('control shift');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No main key detected. Please specify a key to press.');
    });

    it('should reject multiple main keys', () => {
      const result = HotkeySender.parseHotkeys('control f g');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Multiple main keys detected. Only one main key is allowed.');
    });

    it('should reject invalid key name', () => {
      const result = HotkeySender.parseHotkeys('control invalidkey');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid key');
    });

    it('should handle punctuation in input (commas)', () => {
      const result = HotkeySender.parseHotkeys(', control d.');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control'], key: 'd' });
    });

    it('should handle periods in input', () => {
      const result = HotkeySender.parseHotkeys('control d.');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control'], key: 'd' });
    });

    it('should handle mixed punctuation', () => {
      const result = HotkeySender.parseHotkeys('control, shift, f.');
      expect(result.success).toBe(true);
      expect(result.combination).toEqual({ modifiers: ['control', 'shift'], key: 'f' });
    });
  });

  describe('normalizeKeyName', () => {
    it('should normalize modifier names', () => {
      expect(HotkeySender.normalizeKeyName('control')).toBe('control');
      expect(HotkeySender.normalizeKeyName('ctrl')).toBe('control');
      expect(HotkeySender.normalizeKeyName('shift')).toBe('shift');
      expect(HotkeySender.normalizeKeyName('alt')).toBe('alt');
      expect(HotkeySender.normalizeKeyName('meta')).toBe('meta');
      expect(HotkeySender.normalizeKeyName('win')).toBe('meta');
      expect(HotkeySender.normalizeKeyName('windows')).toBe('meta');
      expect(HotkeySender.normalizeKeyName('cmd')).toBe('meta');
      expect(HotkeySender.normalizeKeyName('command')).toBe('meta');
    });

    it('should normalize special keys', () => {
      expect(HotkeySender.normalizeKeyName('escape')).toBe('escape');
      expect(HotkeySender.normalizeKeyName('space')).toBe('space');
      expect(HotkeySender.normalizeKeyName('enter')).toBe('enter');
      expect(HotkeySender.normalizeKeyName('return')).toBe('enter');
      expect(HotkeySender.normalizeKeyName('tab')).toBe('tab');
      expect(HotkeySender.normalizeKeyName('backspace')).toBe('backspace');
      expect(HotkeySender.normalizeKeyName('delete')).toBe('delete');
      expect(HotkeySender.normalizeKeyName('insert')).toBe('insert');
      expect(HotkeySender.normalizeKeyName('home')).toBe('home');
      expect(HotkeySender.normalizeKeyName('end')).toBe('end');
      expect(HotkeySender.normalizeKeyName('pageup')).toBe('pageup');
      expect(HotkeySender.normalizeKeyName('pagedown')).toBe('pagedown');
      expect(HotkeySender.normalizeKeyName('up')).toBe('up');
      expect(HotkeySender.normalizeKeyName('down')).toBe('down');
      expect(HotkeySender.normalizeKeyName('left')).toBe('left');
      expect(HotkeySender.normalizeKeyName('right')).toBe('right');
    });

    it('should normalize function keys', () => {
      expect(HotkeySender.normalizeKeyName('f1')).toBe('f1');
      expect(HotkeySender.normalizeKeyName('f5')).toBe('f5');
      expect(HotkeySender.normalizeKeyName('f12')).toBe('f12');
    });

    it('should keep lowercase letters as lowercase', () => {
      expect(HotkeySender.normalizeKeyName('a')).toBe('a');
      expect(HotkeySender.normalizeKeyName('z')).toBe('z');
    });

    it('should return digits as is', () => {
      expect(HotkeySender.normalizeKeyName('0')).toBe('0');
      expect(HotkeySender.normalizeKeyName('5')).toBe('5');
      expect(HotkeySender.normalizeKeyName('9')).toBe('9');
    });

    it('should return null for invalid keys', () => {
      expect(HotkeySender.normalizeKeyName('invalid')).toBe(null);
      expect(HotkeySender.normalizeKeyName('xyz')).toBe(null);
      expect(HotkeySender.normalizeKeyName('abc')).toBe(null);
    });
  });

  describe('sendHotkeys', () => {
    it('should send key without modifiers', async () => {
      const combination: HotkeyCombination = { modifiers: [], key: 'f' };

      await HotkeySender.sendHotkeys(combination);

      expect(robot.keyTap).toHaveBeenCalledWith('f');
    });

    it('should send key with one modifier', async () => {
      const combination: HotkeyCombination = { modifiers: ['control'], key: 'f' };

      await HotkeySender.sendHotkeys(combination);

      expect(robot.keyTap).toHaveBeenCalledWith('f', ['control']);
    });

    it('should send key with multiple modifiers', async () => {
      const combination: HotkeyCombination = { modifiers: ['control', 'shift'], key: 'f' };

      await HotkeySender.sendHotkeys(combination);

      expect(robot.keyTap).toHaveBeenCalledWith('f', ['control', 'shift']);
    });

    it('should convert meta to command modifier', async () => {
      const combination: HotkeyCombination = { modifiers: ['meta'], key: 'd' };

      await HotkeySender.sendHotkeys(combination);

      expect(robot.keyTap).toHaveBeenCalledWith('d', ['command']);
    });

    it('should convert meta to command in combination with other modifiers', async () => {
      const combination: HotkeyCombination = { modifiers: ['control', 'meta'], key: 'f' };

      await HotkeySender.sendHotkeys(combination);

      expect(robot.keyTap).toHaveBeenCalledWith('f', ['control', 'command']);
    });
  });
});
