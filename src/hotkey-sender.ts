import * as robot from 'robotjs';

/**
 * Represents a parsed hotkey combination
 */
export interface HotkeyCombination {
  modifiers: string[]; // e.g., ['control', 'shift']
  key: string;        // e.g., 'f'
}

/**
 * Result of parsing a hotkey string
 */
export interface ParseResult {
  success: boolean;
  combination?: HotkeyCombination;
  error?: string;
}

/**
 * Key name mappings for spoken key names to robotjs format
 */
const KEY_NAME_MAP: Record<string, string> = {
  // Modifiers
  'control': 'control',
  'ctrl': 'control',
  'shift': 'shift',
  'alt': 'alt',
  'meta': 'meta',
  'win': 'meta',
  'windows': 'meta',
  'cmd': 'meta',
  'command': 'meta',

  // Special keys
  'escape': 'escape',
  'space': 'space',
  'enter': 'enter',
  'return': 'enter',
  'tab': 'tab',
  'backspace': 'backspace',
  'delete': 'delete',
  'insert': 'insert',
  'home': 'home',
  'end': 'end',
  'pageup': 'pageup',
  'pagedown': 'pagedown',
  'up': 'up',
  'down': 'down',
  'left': 'left',
  'right': 'right',

  // Function keys
  'f1': 'f1',
  'f2': 'f2',
  'f3': 'f3',
  'f4': 'f4',
  'f5': 'f5',
  'f6': 'f6',
  'f7': 'f7',
  'f8': 'f8',
  'f9': 'f9',
  'f10': 'f10',
  'f11': 'f11',
  'f12': 'f12',
};

/**
 * Valid modifier keys
 */
const VALID_MODIFIERS = ['control', 'shift', 'alt', 'meta'];

/**
 * HotkeySender class for parsing and sending keyboard shortcuts
 */
export class HotkeySender {
  /**
   * Parse a hotkey string into a structured combination
   * @param hotkeyString - String like "control shift f" or "alt tab"
   * @returns ParseResult with combination or error
   */
  static parseHotkeys(hotkeyString: string): ParseResult {
    if (!hotkeyString || hotkeyString.trim() === '') {
      return { success: false, error: 'Hotkey string is empty' };
    }

    // Normalize: lowercase, trim, remove punctuation (commas, periods, etc.), and extra spaces
    const normalized = hotkeyString
      .toLowerCase()
      .trim()
      .replace(/[,.\-!?;:]/g, '') // Remove common punctuation
      .replace(/\s+/g, ' '); // Normalize spaces

    const parts = normalized.split(' ').filter(part => part.length > 0);

    if (parts.length === 0) {
      return { success: false, error: 'No keys detected' };
    }

    const modifiers: string[] = [];
    let mainKey: string | null = null;

    // Parse each part
    for (const part of parts) {
      const normalizedKey = this.normalizeKeyName(part);

      if (!normalizedKey) {
        return { success: false, error: `Invalid key: "${part}"` };
      }

      // Check if it's a modifier
      if (VALID_MODIFIERS.includes(normalizedKey)) {
        modifiers.push(normalizedKey);
      } else {
        // It's the main key
        if (mainKey !== null) {
          return { success: false, error: 'Multiple main keys detected. Only one main key is allowed.' };
        }
        mainKey = normalizedKey;
      }
    }

    if (!mainKey) {
      return { success: false, error: 'No main key detected. Please specify a key to press.' };
    }

    return {
      success: true,
      combination: { modifiers, key: mainKey }
    };
  }

  /**
   * Send a hotkey combination to the focused window
   * @param combination - The hotkey combination to send
   */
  static async sendHotkeys(combination: HotkeyCombination): Promise<void> {
    try {
      console.log(`🎹 Sending hotkeys: ${combination.modifiers.join('+')}+${combination.key}`);

      // Convert 'meta' to 'command' for robotjs compatibility on all platforms
      const robotjsModifiers = combination.modifiers.map(mod =>
        mod === 'meta' ? 'command' : mod
      );

      if (robotjsModifiers.length > 0) {
        robot.keyTap(combination.key, robotjsModifiers);
      } else {
        robot.keyTap(combination.key);
      }

      console.log('✅ Hotkeys sent successfully');
    } catch (error) {
      console.error('❌ Error sending hotkeys:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send hotkeys: ${errorMessage}`);
    }
  }

  /**
   * Normalize a spoken key name to robotjs format
   * @param key - The spoken key name
   * @returns Normalized key name or null if invalid
   */
  static normalizeKeyName(key: string): string | null {
    const normalized = key.toLowerCase().trim();

    // Check if it's in the map
    if (KEY_NAME_MAP[normalized]) {
      return KEY_NAME_MAP[normalized];
    }

    // Check if it's a single letter
    if (normalized.length === 1 && /^[a-z]$/.test(normalized)) {
      return normalized;
    }

    // Check if it's a single digit
    if (normalized.length === 1 && /^[0-9]$/.test(normalized)) {
      return normalized;
    }

    return null;
  }

  /**
   * Parse and send hotkeys in one step
   * @param hotkeyString - String like "control shift f"
   */
  static async send(hotkeyString: string): Promise<string> {
    const parseResult = this.parseHotkeys(hotkeyString);

    if (!parseResult.success) {
      throw new Error(parseResult.error);
    }

    await this.sendHotkeys(parseResult.combination!);

    return `Sent hotkeys: ${hotkeyString}`;
  }
}
