import * as robot from 'robotjs';
import { clipboard } from 'electron';
import { AppSettings } from './types';

export class TextInserter {
  private static readonly INSERTION_DELAY = 50; // ms entre caracteres
  private static readonly CLIPBOARD_PASTE_DELAY = 100; // ms para operações de clipboard

  static async insertText(text: string, mode: 'replace' | 'append' = 'append', settings?: AppSettings): Promise<void> {
    try {
      const useClipboard = settings?.behavior?.useClipboard !== false; // Default true para compatibilidade

      if (useClipboard) {
        console.log('Inserting text (via clipboard):', text.substring(0, 50) + '...');

        // Try first using clipboard (fast method)
        const success = await this.insertTextViaClipboard(text, mode);

        if (!success) {
          console.log('Fallback: using character-by-character typing...');
          await this.insertTextViaTyping(text, mode);
        }
      } else {
        console.log('Inserting text (via typing):', text.substring(0, 50) + '...');
        await this.insertTextViaTyping(text, mode);
      }

      console.log('Text inserted successfully');
    } catch (error) {
      console.error('Error inserting text:', error);

      // Try fallback in case of error
      try {
        console.log('Trying fallback after error...');
        await this.insertTextViaTyping(text, mode);
      } catch (fallbackError) {
        console.error('Error in fallback as well:', fallbackError);
        throw fallbackError;
      }
    }
  }

  private static async insertTextViaClipboard(text: string, mode: 'replace' | 'append' = 'append'): Promise<boolean> {
    try {
      // Backup the entire clipboard (all formats)
      const clipboardBackup: { format: string; data: any }[] = [];
      try {
        const formats = clipboard.availableFormats();
        console.log(`📋 Backing up clipboard formats: ${formats.join(', ')}`);

        for (const format of formats) {
          try {
            let data: any;

            switch (format) {
              case 'text/plain':
                data = clipboard.readText();
                break;
              case 'text/html':
                data = clipboard.readHTML();
                break;
              case 'image/png':
              case 'image/jpeg':
                data = clipboard.readImage();
                break;
              default:
                data = clipboard.readBuffer(format);
            }

            if (data) {
              clipboardBackup.push({ format, data });
            }
          } catch (formatError) {
            console.warn(`⚠️ Could not backup format ${format}:`, formatError);
          }
        }
      } catch (clipboardError) {
        console.warn('⚠️ Could not read current clipboard:', clipboardError);
      }

      // Small pause to ensure the field is focused
      await this.delay(this.CLIPBOARD_PASTE_DELAY);

      if (mode === 'replace') {
        // Select all (Ctrl+A)
        robot.keyTap('a', 'control');
        await this.delay(50);
      }

      // Copiar texto para clipboard
      clipboard.writeText(text);
      await this.delay(50);

      // Paste using Ctrl+V
      robot.keyTap('v', 'control');
      await this.delay(this.CLIPBOARD_PASTE_DELAY);

      // Restore original clipboard (with delay to ensure paste is completed)
      setTimeout(() => {
        if (clipboardBackup.length > 0) {
          console.log(`🔄 Restoring clipboard (${clipboardBackup.length} formats)`);

          try {
            // Build write data object with all formats
            const writeData: {
              text?: string;
              html?: string;
              image?: Electron.NativeImage;
            } = {};

            for (const { format, data } of clipboardBackup) {
              try {
                switch (format) {
                  case 'text/plain':
                    writeData.text = data;
                    break;
                  case 'text/html':
                    writeData.html = data;
                    break;
                  case 'image/png':
                  case 'image/jpeg':
                    writeData.image = data;
                    break;
                  default:
                    // For custom formats, we need to use writeBuffer separately
                    clipboard.writeBuffer(format, data);
                }
              } catch (formatError) {
                console.warn(`⚠️ Could not process format ${format}:`, formatError);
              }
            }

            // Write all formats at once
            if (Object.keys(writeData).length > 0) {
              clipboard.write(writeData);
            }

            console.log('✅ Clipboard restored successfully');
          } catch (restoreError) {
            console.warn('⚠️ Could not restore clipboard:', restoreError);
          }
        }
      }, 200);

      return true;
    } catch (error) {
      console.error('❌ Error inserting via clipboard:', error);
      return false;
    }
  }

  private static async insertTextViaTyping(text: string, mode: 'replace' | 'append' = 'append'): Promise<void> {
    // Small pause to ensure the field is focused
    await this.delay(100);

    if (mode === 'replace') {
      // Select all (Ctrl+A) and then type
      robot.keyTap('a', 'control');
      await this.delay(50);
    }

    // Insert text character by character for better compatibility
    await this.typeText(text);
  }

  private static async typeText(text: string): Promise<void> {
    // Split into words for a more natural insertion
    const words = text.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Type word
      robot.typeString(word);

      // Add space if not last word
      if (i < words.length - 1) {
        robot.typeString(' ');
      }

      // Small pause between words
      await this.delay(this.INSERTION_DELAY);
    }
  }

  static async simulateKeyPress(key: string, modifiers?: string[]): Promise<void> {
    try {
      if (modifiers && modifiers.length > 0) {
        robot.keyTap(key, modifiers);
      } else {
        robot.keyTap(key);
      }
    } catch (error) {
      console.error('Error simulating key:', error);
      throw error;
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static getMousePosition(): { x: number; y: number } {
    return robot.getMousePos();
  }

  static clickAtPosition(x: number, y: number): void {
    robot.moveMouse(x, y);
    robot.mouseClick();
  }
}
