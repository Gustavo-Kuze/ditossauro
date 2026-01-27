import { BaseCodeInterpreter } from './base-code-interpreter';
import { HotkeySender } from '../hotkey-sender';

/**
 * HotkeyInterpreter interprets hotkey commands and sends them to the focused window.
 * Unlike code interpreters that generate code, this interpreter sends keyboard shortcuts.
 */
export class HotkeyInterpreter extends BaseCodeInterpreter {
  constructor(apiKey?: string) {
    super(apiKey || '');
    // HotkeyInterpreter doesn't need an API key, but we accept it for interface compatibility
  }

  /**
   * Get system prompt (not used for hotkeys, but required by base class)
   */
  protected getSystemPrompt(context?: string): string {
    return 'Hotkey interpreter for sending keyboard shortcuts to the focused window.';
  }

  /**
   * Interpret a hotkey string and send it to the focused window
   * @param hotkeyString - String like "control shift f" or "alt tab"
   * @param context - Optional context (ignored for hotkeys)
   * @returns Confirmation message
   */
  async interpretCode(hotkeyString: string, context?: string): Promise<string> {
    try {
      console.log(`🎹 Interpreting hotkeys: "${hotkeyString}"`);

      // We explicitly ignore context for hotkeys as per design

      const result = await HotkeySender.send(hotkeyString);

      console.log(`✅ Hotkeys sent successfully: ${result}`);
      return result;
    } catch (error: any) {
      console.error('❌ Error interpreting hotkeys:', error);
      throw new Error(`Failed to send hotkeys: ${error.message || error}`);
    }
  }

  /**
   * HotkeyInterpreter is always "configured" since it doesn't need an API key
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'HotkeyInterpreter';
  }
}
