import { clipboard } from 'electron';
import * as robot from 'robotjs';
import { AppSettings } from './types';

/**
 * ContextManager handles capturing selected text from the focused application
 * by simulating CTRL+C and reading the clipboard.
 */
export class ContextManager {
    private static originalClipboard: string = '';
    private static capturedContext: string = '';
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

            // Backup current clipboard
            this.originalClipboard = '';
            try {
                this.originalClipboard = clipboard.readText();
                console.log('Backed up clipboard');
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
            if (this.originalClipboard) {
                clipboard.writeText(this.originalClipboard);
                console.log('Restored original clipboard');
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
