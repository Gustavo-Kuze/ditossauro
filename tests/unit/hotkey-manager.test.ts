import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HotkeyManager } from '@/hotkey-manager';
import { uIOhook, UiohookKey } from 'uiohook-napi';

// uIOhook is already mocked in tests/setup.ts

describe('HotkeyManager', () => {
  let hotkeyManager: HotkeyManager;
  let keydownListener: (event: any) => void;
  let keyupListener: (event: any) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    hotkeyManager = new HotkeyManager();

    // Capture the event listeners registered with uIOhook
    vi.mocked(uIOhook.on).mockImplementation((event: string, listener: any) => {
      if (event === 'keydown') {
        keydownListener = listener;
      } else if (event === 'keyup') {
        keyupListener = listener;
      }
      return uIOhook;
    });
  });

  describe('register', () => {
    it('should register start/stop hotkey configuration', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);

      // Should start listening (uIOhook.start should be called)
      expect(uIOhook.start).toHaveBeenCalled();
    });

    it('should register code snippet hotkey configuration', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'push-to-talk' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);

      expect(uIOhook.on).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(uIOhook.on).toHaveBeenCalledWith('keyup', expect.any(Function));
    });

    it('should register cancel key', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig, 'Escape');

      expect(uIOhook.start).toHaveBeenCalled();
    });

    it('should only call start once if registered multiple times', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);
      hotkeyManager.register(startStopConfig, codeSnippetConfig);

      // Should only start once
      expect(uIOhook.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregister', () => {
    it('should stop listening and clear hotkeys', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);
      hotkeyManager.unregister();

      expect(uIOhook.stop).toHaveBeenCalled();
    });

    it('should not error if unregistering when not registered', () => {
      expect(() => {
        hotkeyManager.unregister();
      }).not.toThrow();
    });
  });

  describe('hotkey detection - toggle mode', () => {
    beforeEach(() => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);
    });

    it('should emit hotkey-pressed when start/stop hotkey is pressed', () => {
      const handler = vi.fn();
      hotkeyManager.on('hotkey-pressed', handler);

      // Simulate Control+Meta keydown
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(handler).toHaveBeenCalled();
    });

    it('should emit code-snippet-hotkey-pressed when code snippet hotkey is pressed', () => {
      const handler = vi.fn();
      hotkeyManager.on('code-snippet-hotkey-pressed', handler);

      // Simulate Control+Shift+Meta keydown
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Shift });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(handler).toHaveBeenCalled();
    });

    it('should NOT emit start/stop when code snippet hotkey is active', () => {
      const startStopHandler = vi.fn();
      const codeSnippetHandler = vi.fn();

      hotkeyManager.on('hotkey-pressed', startStopHandler);
      hotkeyManager.on('code-snippet-hotkey-pressed', codeSnippetHandler);

      // Press Control+Shift+Meta (code snippet)
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Shift });
      keydownListener({ keycode: UiohookKey.Meta });

      // Code snippet should fire
      expect(codeSnippetHandler).toHaveBeenCalled();

      // Start/stop should NOT fire even though Ctrl+Meta are pressed
      expect(startStopHandler).not.toHaveBeenCalled();
    });

    it('should debounce toggle mode to avoid multiple toggles', () => {
      const handler = vi.fn();
      hotkeyManager.on('hotkey-pressed', handler);

      // First press
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(handler).toHaveBeenCalledTimes(1);

      // Release and immediately re-press (within debounce window)
      keyupListener({ keycode: UiohookKey.Meta });
      keydownListener({ keycode: UiohookKey.Meta });

      // Should still be 1 due to debounce
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('hotkey detection - push-to-talk mode', () => {
    beforeEach(() => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'push-to-talk' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'push-to-talk' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);
    });

    it('should emit hotkey-pressed on keydown in push-to-talk mode', () => {
      const handler = vi.fn();
      hotkeyManager.on('hotkey-pressed', handler);

      // Press hotkey
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(handler).toHaveBeenCalled();
    });

    it('should emit hotkey-released on keyup in push-to-talk mode', () => {
      const pressHandler = vi.fn();
      const releaseHandler = vi.fn();

      hotkeyManager.on('hotkey-pressed', pressHandler);
      hotkeyManager.on('hotkey-released', releaseHandler);

      // Press hotkey
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(pressHandler).toHaveBeenCalled();

      // Release hotkey
      keyupListener({ keycode: UiohookKey.Meta });

      expect(releaseHandler).toHaveBeenCalled();
    });

    it('should emit code-snippet-hotkey-released on keyup in push-to-talk mode', () => {
      const pressHandler = vi.fn();
      const releaseHandler = vi.fn();

      hotkeyManager.on('code-snippet-hotkey-pressed', pressHandler);
      hotkeyManager.on('code-snippet-hotkey-released', releaseHandler);

      // Press code snippet hotkey
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Shift });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(pressHandler).toHaveBeenCalled();

      // Release hotkey
      keyupListener({ keycode: UiohookKey.Meta });

      expect(releaseHandler).toHaveBeenCalled();
    });

    it('should NOT debounce push-to-talk mode (emit immediately)', () => {
      const handler = vi.fn();
      hotkeyManager.on('hotkey-pressed', handler);

      // First press
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Meta });

      expect(handler).toHaveBeenCalledTimes(1);

      // Release
      keyupListener({ keycode: UiohookKey.Meta });
      keyupListener({ keycode: UiohookKey.Ctrl });

      // Press again immediately
      keydownListener({ keycode: UiohookKey.Ctrl });
      keydownListener({ keycode: UiohookKey.Meta });

      // Should fire again (no debounce in push-to-talk)
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancel key detection', () => {
    it('should emit cancel-pressed when cancel key is pressed', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig, 'Escape');

      const cancelHandler = vi.fn();
      hotkeyManager.on('cancel-pressed', cancelHandler);

      // Press Escape
      keydownListener({ keycode: UiohookKey.Escape });

      expect(cancelHandler).toHaveBeenCalled();
    });

    it('should check cancel key before other hotkeys', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig, 'Escape');

      const cancelHandler = vi.fn();
      const hotkeyHandler = vi.fn();

      hotkeyManager.on('cancel-pressed', cancelHandler);
      hotkeyManager.on('hotkey-pressed', hotkeyHandler);

      // Press Escape (cancel key)
      keydownListener({ keycode: UiohookKey.Escape });

      // Cancel should be called
      expect(cancelHandler).toHaveBeenCalled();

      // Hotkey should NOT be called
      expect(hotkeyHandler).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty key configuration gracefully', () => {
      const startStopConfig = {
        keys: [],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      expect(() => {
        hotkeyManager.register(startStopConfig, codeSnippetConfig);
      }).not.toThrow();
    });

    it('should handle unknown key codes gracefully', () => {
      const startStopConfig = {
        keys: ['UnknownKey' as any],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      expect(() => {
        hotkeyManager.register(startStopConfig, codeSnippetConfig);
      }).not.toThrow();
    });

    it('should only emit when ALL required keys are pressed', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);

      const handler = vi.fn();
      hotkeyManager.on('hotkey-pressed', handler);

      // Press only Control (not enough)
      keydownListener({ keycode: UiohookKey.Ctrl });

      // Should not emit yet
      expect(handler).not.toHaveBeenCalled();

      // Now press Meta (complete the combination)
      keydownListener({ keycode: UiohookKey.Meta });

      // Should emit now
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should unregister hotkeys when destroyed', () => {
      const startStopConfig = {
        keys: ['Control', 'Meta'],
        mode: 'toggle' as const
      };

      const codeSnippetConfig = {
        keys: ['Control', 'Shift', 'Meta'],
        mode: 'toggle' as const
      };

      hotkeyManager.register(startStopConfig, codeSnippetConfig);
      hotkeyManager.destroy();

      expect(uIOhook.stop).toHaveBeenCalled();
    });
  });
});
