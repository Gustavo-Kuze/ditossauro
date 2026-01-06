/**
 * i18n configuration for renderer process
 */

type TranslationObject = {
    [key: string]: string | TranslationObject;
};

type Translations = {
    [locale: string]: TranslationObject;
};

class I18n {
    private currentLocale = 'pt-BR';
    private translations: Translations = {};
    private fallbackLocale = 'en';

    async init(locale = 'pt-BR') {
        this.currentLocale = locale;

        // Load translations dynamically
        try {
            const ptBR = await import('./locales/pt-BR.json');
            const en = await import('./locales/en.json');

            this.translations = {
                'pt-BR': ptBR.default,
                'en': en.default
            };
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    setLocale(locale: string) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            // Persist locale preference
            if (typeof window !== 'undefined' && window.electronAPI) {
                window.electronAPI.updateSettings('locale', { locale }).catch(console.error);
            }
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
export const i18n = new I18n();
export default i18n;
