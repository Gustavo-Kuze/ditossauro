import { clipboard } from 'electron';
import * as robot from 'robotjs';
import { AppSettings } from './types';

/**
 * ContextManager handles capturing selected text from the focused application
 * by simulating CTRL+C and reading the clipboard.
 */
export class ContextManager {
    private static originalClipboard: { format: string; data: any }[] = [];
    private static capturedContext = '';
    private static readonly CLIPBOARD_DELAY = 150; // ms to wait for clipboard operations

    /**
     * Captures the currently selected text from the focused application
     * @param settings Application settings to check if context capture is enabled
     * @returns The captured context text, or empty string if disabled or failed
     */
    static async captureSelection(settings?: AppSettings): Promise<string> {
        try {
            // Check if context capture is globally enabled
            if (settings && !settings.contextCapture?.enabled) {
                console.log('Context capture is disabled in settings');
                return '';
            }

            // Backup the entire clipboard (all formats) before capturing selection
            this.originalClipboard = [];
            try {
                const formats = clipboard.availableFormats();
                console.log(`📋 Backing up clipboard formats before context capture: ${formats.join(', ')}`);

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
                            this.originalClipboard.push({ format, data });
                        }
                    } catch (formatError) {
                        console.warn(`⚠️ Could not backup format ${format}:`, formatError);
                    }
                }
                console.log(`✅ Backed up ${this.originalClipboard.length} clipboard formats`);
            } catch (clipboardError) {
                console.warn('Could not read current clipboard:', clipboardError);
            }

            // Small delay to ensure focus is stable
            await this.delay(50);

            // Simulate CTRL+C to copy selected text
            console.log('Simulating CTRL+C to capture selection...');
            robot.keyTap('c', ['control']);

            // Wait for clipboard operation to complete
            await this.delay(this.CLIPBOARD_DELAY);

            // Read the captured context from clipboard
            try {
                this.capturedContext = clipboard.readText();
                console.log(`Captured context (${this.capturedContext.length} chars):`,
                    this.capturedContext.substring(0, 100) + (this.capturedContext.length > 100 ? '...' : ''));
            } catch (readError) {
                console.error('Failed to read clipboard after CTRL+C:', readError);
                this.capturedContext = '';
            }

            return this.capturedContext;
        } catch (error) {
            console.error('Error capturing selection:', error);
            return '';
        }
    }

    /**
     * Restores the original clipboard content
     */
    static restoreClipboard(): void {
        try {
            if (this.originalClipboard.length > 0) {
                console.log(`🔄 Restoring original clipboard (${this.originalClipboard.length} formats)`);

                // Build write data object with all formats
                const writeData: {
                    text?: string;
                    html?: string;
                    image?: Electron.NativeImage;
                } = {};

                for (const { format, data } of this.originalClipboard) {
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

                console.log('✅ Original clipboard restored successfully');
            } else {
                console.log('⚠️ No original clipboard to restore');
            }
        } catch (error) {
            console.warn('Could not restore clipboard:', error);
        }
    }

    /**
     * Gets the captured context
     */
    static getContext(): string {
        return this.capturedContext;
    }

    /**
     * Clears the captured context
     */
    static clearContext(): void {
        this.capturedContext = '';
    }

    /**
     * Utility delay function
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Checks if context should be used for a specific command type
     * @param commandType The detected command type
     * @param settings Application settings
     * @returns true if context should be used, false otherwise
     */
    static shouldUseContextForCommand(
        commandType: 'bash' | 'javascript' | 'typescript' | 'python' | 'hotkeys' | 'translate' | 'dito',
        settings?: AppSettings
    ): boolean {
        // Hotkeys never use context
        if (commandType === 'hotkeys') {
            return false;
        }

        // Check if context capture is globally enabled
        if (!settings?.contextCapture?.enabled) {
            return false;
        }

        // Check per-command setting
        return settings.contextCapture[commandType] ?? true;
    }
}
