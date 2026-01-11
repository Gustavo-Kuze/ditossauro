import { uIOhook, UiohookKey } from 'uiohook-napi';
import { HotkeyConfig } from './types';
import { EventEmitter } from 'events';

/**
 * Mapping of key names to uiohook codes
 */
const KEY_CODE_MAP: Record<string, number> = {
  // Modifiers
  'Control': UiohookKey.Ctrl,
  'ControlLeft': UiohookKey.CtrlLeft,
  'ControlRight': UiohookKey.CtrlRight,
  'Shift': UiohookKey.Shift,
  'ShiftLeft': UiohookKey.ShiftLeft,
  'ShiftRight': UiohookKey.ShiftRight,
  'Alt': UiohookKey.Alt,
  'AltLeft': UiohookKey.AltLeft,
  'AltRight': UiohookKey.AltRight,
  'Meta': UiohookKey.Meta,
  'MetaLeft': UiohookKey.MetaLeft,
  'MetaRight': UiohookKey.MetaRight,

  // Function keys
  'F1': UiohookKey.F1,
  'F2': UiohookKey.F2,
  'F3': UiohookKey.F3,
  'F4': UiohookKey.F4,
  'F5': UiohookKey.F5,
  'F6': UiohookKey.F6,
  'F7': UiohookKey.F7,
  'F8': UiohookKey.F8,
  'F9': UiohookKey.F9,
  'F10': UiohookKey.F10,
  'F11': UiohookKey.F11,
  'F12': UiohookKey.F12,

  // Special keys
  'Escape': UiohookKey.Escape,
  'Space': UiohookKey.Space,
  'Enter': UiohookKey.Enter,
  'Tab': UiohookKey.Tab,
  'Backspace': UiohookKey.Backspace,

  // Numbers
  '0': UiohookKey.Digit0,
  '1': UiohookKey.Digit1,
  '2': UiohookKey.Digit2,
  '3': UiohookKey.Digit3,
  '4': UiohookKey.Digit4,
  '5': UiohookKey.Digit5,
  '6': UiohookKey.Digit6,
  '7': UiohookKey.Digit7,
  '8': UiohookKey.Digit8,
  '9': UiohookKey.Digit9,

  // Letters
  'A': UiohookKey.A, 'B': UiohookKey.B, 'C': UiohookKey.C, 'D': UiohookKey.D,
  'E': UiohookKey.E, 'F': UiohookKey.F, 'G': UiohookKey.G, 'H': UiohookKey.H,
  'I': UiohookKey.I, 'J': UiohookKey.J, 'K': UiohookKey.K, 'L': UiohookKey.L,
  'M': UiohookKey.M, 'N': UiohookKey.N, 'O': UiohookKey.O, 'P': UiohookKey.P,
  'Q': UiohookKey.Q, 'R': UiohookKey.R, 'S': UiohookKey.S, 'T': UiohookKey.T,
  'U': UiohookKey.U, 'V': UiohookKey.V, 'W': UiohookKey.W, 'X': UiohookKey.X,
  'Y': UiohookKey.Y, 'Z': UiohookKey.Z,
};

export interface HotkeyManagerEvents {
  'hotkey-pressed': () => void;
  'hotkey-released': () => void;
  'code-snippet-hotkey-pressed': () => void;
  'code-snippet-hotkey-released': () => void;
  'cancel-pressed': () => void;
}

export declare interface HotkeyManager {
  on<U extends keyof HotkeyManagerEvents>(
    event: U,
    listener: HotkeyManagerEvents[U]
  ): this;

  emit<U extends keyof HotkeyManagerEvents>(
    event: U,
    ...args: Parameters<HotkeyManagerEvents[U]>
  ): boolean;
}

export class HotkeyManager extends EventEmitter {
  private startStopConfig: HotkeyConfig | null = null;
  private codeSnippetConfig: HotkeyConfig | null = null;
  private cancelKey: string | null = null;
  private pressedKeys = new Set<number>();
  private isStartStopHotkeyActive = false;
  private isCodeSnippetHotkeyActive = false;
  private isListening = false;
  private lastStartStopToggleTime = 0;
  private lastCodeSnippetToggleTime = 0;
  private readonly DEBOUNCE_MS = 100; // Debounce to avoid multiple toggles

  constructor() {
    super();
  }

  /**
   * Registers the hotkeys
   */
  register(startStopConfig: HotkeyConfig, codeSnippetConfig: HotkeyConfig, cancelKey?: string): void {
    this.startStopConfig = startStopConfig;
    this.codeSnippetConfig = codeSnippetConfig;
    this.cancelKey = cancelKey || null;

    if (!this.isListening) {
      this.startListening();
    }

    const startStopKeysStr = startStopConfig.keys.join('+');
    const codeSnippetKeysStr = codeSnippetConfig.keys.join('+');
    console.log(`✅ Hotkey registered (start/stop): ${startStopKeysStr} (mode: ${startStopConfig.mode})`);
    console.log(`✅ Hotkey registered (code snippet): ${codeSnippetKeysStr} (mode: ${codeSnippetConfig.mode})`);
    if (cancelKey) {
      console.log(`✅ Cancel key: ${cancelKey}`);
    }
  }

  /**
   * Removes the registration of all hotkeys
   */
  unregister(): void {
    this.stopListening();
    this.startStopConfig = null;
    this.codeSnippetConfig = null;
    this.cancelKey = null;
    this.pressedKeys.clear();
    this.isStartStopHotkeyActive = false;
    this.isCodeSnippetHotkeyActive = false;
    console.log('🔇 Hotkeys unregistered');
  }

  /**
   * Starts listening for keyboard events
   */
  private startListening(): void {
    if (this.isListening) return;

    uIOhook.on('keydown', (event) => {
      this.pressedKeys.add(event.keycode);
      this.checkHotkeys();
    });

    uIOhook.on('keyup', (event) => {
      const wasStartStopActive = this.isStartStopHotkeyActive;
      const wasCodeSnippetActive = this.isCodeSnippetHotkeyActive;

      this.pressedKeys.delete(event.keycode);

      // If code snippet was active, skip checking start/stop during release
      // to prevent overlapping hotkey activation
      const skipStartStop = wasCodeSnippetActive;
      this.checkHotkeys(skipStartStop);

      // If the start/stop hotkey was released
      if (wasStartStopActive && !this.isStartStopHotkeyActive) {
        if (this.startStopConfig?.mode === 'push-to-talk') {
          this.emit('hotkey-released');
        }
      }

      // If the code snippet hotkey was released
      if (wasCodeSnippetActive && !this.isCodeSnippetHotkeyActive) {
        if (this.codeSnippetConfig?.mode === 'push-to-talk') {
          this.emit('code-snippet-hotkey-released');
        }
      }
    });

    uIOhook.start();
    this.isListening = true;
    console.log('🎧 Starting hotkey listening...');
  }

  /**
   * Stops listening for keyboard events
   */
  private stopListening(): void {
    if (!this.isListening) return;

    try {
      uIOhook.stop();
      this.isListening = false;
      console.log('🔇 Hotkey listening stopped');
    } catch (error) {
      console.error('Error stopping uIOhook:', error);
    }
  }

  /**
   * Checks if any key combination is pressed
   */
  private checkHotkeys(skipStartStop = false): void {
    // Check cancel key first
    if (this.cancelKey) {
      const cancelKeyCode = KEY_CODE_MAP[this.cancelKey];
      if (cancelKeyCode && this.pressedKeys.has(cancelKeyCode)) {
        this.emit('cancel-pressed');
        return;
      }
    }

    // Check code snippet hotkey (more specific - 3 keys)
    if (this.codeSnippetConfig) {
      this.checkSpecificHotkey(
        this.codeSnippetConfig,
        this.isCodeSnippetHotkeyActive,
        this.lastCodeSnippetToggleTime,
        'code-snippet-hotkey-pressed',
        (active) => { this.isCodeSnippetHotkeyActive = active; },
        (time) => { this.lastCodeSnippetToggleTime = time; }
      );
    }

    // Check start/stop hotkey (less specific - 2 keys)
    // Only if code snippet is not active AND not during code snippet release
    if (this.startStopConfig && !this.isCodeSnippetHotkeyActive && !skipStartStop) {
      this.checkSpecificHotkey(
        this.startStopConfig,
        this.isStartStopHotkeyActive,
        this.lastStartStopToggleTime,
        'hotkey-pressed',
        (active) => { this.isStartStopHotkeyActive = active; },
        (time) => { this.lastStartStopToggleTime = time; }
      );
    }
  }

  /**
   * Checks a specific hotkey
   */
  private checkSpecificHotkey(
    config: HotkeyConfig,
    isActive: boolean,
    lastToggleTime: number,
    eventName: 'hotkey-pressed' | 'code-snippet-hotkey-pressed',
    setActive: (active: boolean) => void,
    setToggleTime: (time: number) => void
  ): void {
    const requiredKeyCodes = config.keys
      .map(key => KEY_CODE_MAP[key])
      .filter(code => code !== undefined);

    if (requiredKeyCodes.length === 0) return;

    // Check if all required keys are pressed
    const allKeysPressed = requiredKeyCodes.every(code => this.pressedKeys.has(code));

    if (allKeysPressed && !isActive) {
      // Hotkey was pressed
      setActive(true);

      if (config.mode === 'toggle') {
        // Toggle mode: emit only if debounce time has passed
        const now = Date.now();
        if (now - lastToggleTime > this.DEBOUNCE_MS) {
          setToggleTime(now);
          this.emit(eventName);
        }
      } else {
        // Push-to-talk mode: emit immediately
        this.emit(eventName);
      }
    } else if (!allKeysPressed && isActive) {
      // Hotkey was released
      setActive(false);
    }
  }

  /**
   * Destroys the hotkey manager
   */
  destroy(): void {
    this.unregister();
  }
}
