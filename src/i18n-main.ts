/**
 * i18n configuration for main process
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

type TranslationObject = {
    [key: string]: string | TranslationObject;
};

type Translations = {
    [locale: string]: TranslationObject;
};

class I18nMain {
    private currentLocale = 'pt-BR';
    private translations: Translations = {};
    private fallbackLocale = 'en';

    init(locale = 'pt-BR') {
        this.currentLocale = locale;
        this.loadTranslations();
    }

    private loadTranslations() {
        try {
            // Try multiple possible paths to locate the locales directory
            const possiblePaths = [
                path.join(__dirname, 'locales'), // Standard build output
                path.join(__dirname, '..', 'locales'), // One level up
                path.join(app.getAppPath(), 'src', 'locales'), // Source in dev
                path.join(app.getAppPath(), 'locales'), // Root in dev/prod
                path.join(process.resourcesPath, 'locales'), // Extra resources in prod
                // Specific for some Vite/Electron-Forge setups
                path.join(__dirname, '../../src/locales')
            ];

            let localesPath = '';
            for (const p of possiblePaths) {
                console.log(`Checking locales path: ${p}`);
                if (fs.existsSync(p)) {
                    localesPath = p;
                    console.log(`Found locales at: ${localesPath}`);
                    break;
                }
            }

            if (!localesPath) {
                console.warn('Locales directory not found. Translations will not work in Main process.');
                return;
            }

            const ptBRPath = path.join(localesPath, 'pt-BR.json');
            const enPath = path.join(localesPath, 'en.json');

            if (fs.existsSync(ptBRPath)) {
                this.translations['pt-BR'] = JSON.parse(fs.readFileSync(ptBRPath, 'utf-8'));
            } else {
                console.warn(`pt-BR.json not found at ${ptBRPath}`);
            }

            if (fs.existsSync(enPath)) {
                this.translations['en'] = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
            }
        } catch (error) {
            console.error('Error loading translations in main process:', error);
        }
    }

    setLocale(locale: string) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
        }
    }

    getLocale(): string {
        return this.currentLocale;
    }

    t(key: string, params?: { [key: string]: string | number }): string {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLocale];

        // Navigate through the translation object
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to fallback locale
                value = this.translations[this.fallbackLocale];
                for (const k of keys) {
                    if (value && typeof value === 'object' && k in value) {
                        value = value[k];
                    } else {
                        // Return key if translation not found
                        console.warn(`Translation not found for key: ${key}`);
                        return key;
                    }
                }
                break;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`Translation key does not point to a string: ${key}`);
            return key;
        }

        // Replace parameters
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
                return params[paramKey]?.toString() || match;
            });
        }

        return value;
    }

    // Alias for convenience
    translate = this.t.bind(this);
}

// Export singleton instance
export const i18nMain = new I18nMain();
export default i18nMain;
