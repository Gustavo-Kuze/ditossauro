import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { TranscriptionSession } from './types';

export class HistoryManager {
    private historyPath: string;

    constructor() {
        const userDataPath = app.getPath('userData');
        this.historyPath = path.join(userDataPath, 'history.json');
        this.ensureHistoryFileExists();
    }

    private ensureHistoryFileExists(): void {
        if (!fs.existsSync(this.historyPath)) {
            this.saveHistory([]);
        }
    }

    loadHistory(): TranscriptionSession[] {
        try {
            if (!fs.existsSync(this.historyPath)) {
                return [];
            }
            const historyData = fs.readFileSync(this.historyPath, 'utf8');
            const history = JSON.parse(historyData);

            return history.map((session: any) => ({
                ...session,
                timestamp: new Date(session.timestamp)
            }));
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            return [];
        }
    }

    saveHistory(history: TranscriptionSession[]): void {
        try {
            const historyData = JSON.stringify(history, null, 2);
            fs.writeFileSync(this.historyPath, historyData, 'utf8');
            // console.log('Histórico salvo com sucesso');
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
            throw error;
        }
    }

    clearHistory(): void {
        this.saveHistory([]);
    }

    getHistoryPath(): string {
        return this.historyPath;
    }
}
