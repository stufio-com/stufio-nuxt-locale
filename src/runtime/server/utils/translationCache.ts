// Singleton cache for translations at the Nitro server level
// This persists between requests and avoids repeatedly fetching the same translations

interface TranslationCache {
  translations: Record<string, Record<string, string>>;
  timestamp: Record<string, number>;
}

// Initialize the global cache
let globalCache: TranslationCache = {
  translations: {},
  timestamp: {}
};

export const translationCache = {
  // Get translations for a locale
  get(locale: string): Record<string, string> | null {
    if (globalCache.translations[locale]) {
      return globalCache.translations[locale];
    }
    return null;
  },

  // Set translations for a locale
  set(locale: string, translations: Record<string, string>): void {
    globalCache.translations[locale] = translations;
    globalCache.timestamp[locale] = Date.now();
  },

  // Check if translations for a locale are cached
  has(locale: string): boolean {
    return !!globalCache.translations[locale];
  },

  // Get all cached locales
  getLocales(): string[] {
    return Object.keys(globalCache.translations);
  },

  // Get cache age in milliseconds
  age(locale: string): number {
    if (!globalCache.timestamp[locale]) return Infinity;
    return Date.now() - globalCache.timestamp[locale];
  },

  // Clear the cache for a specific locale or all locales
  clear(locale?: string): void {
    if (locale) {
      delete globalCache.translations[locale];
      delete globalCache.timestamp[locale];
    } else {
      globalCache = { translations: {}, timestamp: {} };
    }
  }
};