interface TranslationCache {
  translations: Record<string, Record<string, string>>;
  timestamp: Record<string, number>;
}

let globalCache: TranslationCache = {
  translations: {},
  timestamp: {},
};

export const translationCache = {
  get: (locale) => globalCache.translations[locale] || null,
  set: (locale, translations) => {
    globalCache.translations[locale] = translations;
    globalCache.timestamp[locale] = Date.now();
  },
  has: (locale) => !!globalCache.translations[locale],
  getLocales: () => Object.keys(globalCache.translations),
  age: (locale) =>
    globalCache.timestamp[locale]
      ? Date.now() - globalCache.timestamp[locale]
      : Infinity,
  clear: (locale) => {
    if (locale) {
      delete globalCache.translations[locale];
      delete globalCache.timestamp[locale];
    } else {
      globalCache = { translations: {}, timestamp: {} };
    }
  },
};
