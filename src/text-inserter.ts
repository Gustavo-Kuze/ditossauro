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
        console.log('Inserindo texto (via clipboard):', text.substring(0, 50) + '...');
        
        // Tentar primeiro usando clipboard (método rápido)
        const success = await this.insertTextViaClipboard(text, mode);
        
        if (!success) {
          console.log('Fallback: usando digitação caractere por caractere...');
          await this.insertTextViaTyping(text, mode);
        }
      } else {
        console.log('Inserindo texto (via digitação):', text.substring(0, 50) + '...');
        await this.insertTextViaTyping(text, mode);
      }
      
      console.log('Texto inserido com sucesso');
    } catch (error) {
      console.error('Erro ao inserir texto:', error);
      
      // Tentar fallback em caso de erro
      try {
        console.log('Tentando fallback após erro...');
        await this.insertTextViaTyping(text, mode);
      } catch (fallbackError) {
        console.error('Erro também no fallback:', fallbackError);
        throw fallbackError;
      }
    }
  }

  private static async insertTextViaClipboard(text: string, mode: 'replace' | 'append' = 'append'): Promise<boolean> {
    try {
      // Backup do clipboard atual
      let originalClipboard = '';
      try {
        originalClipboard = clipboard.readText();
      } catch (clipboardError) {
        console.warn('Não foi possível ler clipboard atual:', clipboardError);
      }

      // Pequena pausa para garantir que o campo está focado
      await this.delay(this.CLIPBOARD_PASTE_DELAY);
      
      if (mode === 'replace') {
        // Selecionar tudo (Ctrl+A)
        robot.keyTap('a', 'control');
        await this.delay(50);
      }
      
      // Copiar texto para clipboard
      clipboard.writeText(text);
      await this.delay(50);
      
      // Colar usando Ctrl+V
      robot.keyTap('v', 'control');
      await this.delay(this.CLIPBOARD_PASTE_DELAY);
      
      // Restaurar clipboard original (com delay para garantir que a colagem foi concluída)
      setTimeout(() => {
        try {
          if (originalClipboard) {
            clipboard.writeText(originalClipboard);
          }
        } catch (restoreError) {
          console.warn('Não foi possível restaurar clipboard:', restoreError);
        }
      }, 200);
      
      return true;
    } catch (error) {
      console.error('Erro ao inserir via clipboard:', error);
      return false;
    }
  }

  private static async insertTextViaTyping(text: string, mode: 'replace' | 'append' = 'append'): Promise<void> {
    // Pequena pausa para garantir que o campo está focado
    await this.delay(100);
    
    if (mode === 'replace') {
      // Selecionar tudo (Ctrl+A) e depois digitar
      robot.keyTap('a', 'control');
      await this.delay(50);
    }
    
    // Inserir o texto caractere por caractere para maior compatibilidade
    await this.typeText(text);
  }

  private static async typeText(text: string): Promise<void> {
    // Dividir em palavras para uma inserção mais natural
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Digitar palavra
      robot.typeString(word);
      
      // Adicionar espaço se não for a última palavra
      if (i < words.length - 1) {
        robot.typeString(' ');
      }
      
      // Pequena pausa entre palavras
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
      console.error('Erro ao simular tecla:', error);
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
