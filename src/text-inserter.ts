const robot = require('robotjs');

export class TextInserter {
  private static readonly INSERTION_DELAY = 50; // ms entre caracteres

  static async insertText(text: string, mode: 'replace' | 'append' = 'append'): Promise<void> {
    try {
      console.log('Inserindo texto:', text.substring(0, 50) + '...');
      
      // Pequena pausa para garantir que o campo está focado
      await this.delay(100);
      
      if (mode === 'replace') {
        // Selecionar tudo (Ctrl+A) e depois digitar
        robot.keyTap('a', 'control');
        await this.delay(50);
      }
      
      // Inserir o texto caractere por caractere para maior compatibilidade
      await this.typeText(text);
      
      console.log('Texto inserido com sucesso');
    } catch (error) {
      console.error('Erro ao inserir texto:', error);
      throw error;
    }
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
