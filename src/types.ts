/**
 * Module options for stufio-nuxt-locale
 */
export interface LocaleOptions {
  /**
   * Default locale code
   * @default 'en'
   */
  defaultLocale: string
  
  /**
   * Array of supported locale codes
   * @default ['en']
   */
  locales: string[]
  
  /**
   * API endpoint for loading translations
   * @default ''
   */
  apiEndpoint: string
  
  /**
   * Module name to specify which translations to load
   * @default 'main'
   */
  moduleName: string
  
  /**
   * Whether to detect browser language
   * @default true
   */
  detectBrowserLocale?: boolean
  
  /**
   * Cookie name for storing locale preference
   * @default 'locale'
   */
  cookieName?: string
  
  /**
   * Headers to send with API requests
   */
  apiHeaders?: Record<string, string>
  
  /**
   * Path prefix for internal API handlers
   * @default '/_stufio/i18n'
   */
  apiPathPrefix?: string
}

/**
 * Translation helper function signature
 */
export type TranslateFunction = (key: string, params?: Record<string, any>) => string

/**
 * I18n state interface
 */
export interface I18nState {
  locale: string
  translations: Record<string, Record<string, string>>
  loadedLocales: Record<string, boolean>
  missingKeys: Set<string>
  pendingRequests: number
}

/**
 * Result of useTranslations composable
 */
export interface UseTranslationsReturn {
  /**
   * Translation function
   */
  t: TranslateFunction
  
  /**
   * Current locale
   */
  locale: Ref<string>
  
  /**
   * Set active locale
   */
  setLocale: (locale: string) => Promise<boolean>
  
  /**
   * Available locales
   */
  locales: Ref<string[]>
  
  /**
   * Load translations for a locale
   */
  loadTranslations: (locale: string) => Promise<Record<string, string>>
  
  /**
   * Missing translation keys
   */
  missingKeys: Ref<Set<string>>
}

/**
 * Result of useLocale composable
 */
export interface UseLocaleReturn {
  /**
   * Current locale
   */
  locale: Ref<string>
  
  /**
   * Available locales
   */
  locales: Ref<string[]>
  
  /**
   * Default locale from configuration
   */
  defaultLocale: string
  
  /**
   * Set active locale
   */
  setLocale: (locale: string) => Promise<boolean>
  
  /**
   * Detect preferred locale from browser or cookie
   */
  detectLocale: () => string
  
  /**
   * Format a locale code for display
   */
  formatLocale: (locale: string) => string
}

/**
 * I18n plugin injection
 */
export interface I18nPluginInjection {
  /**
   * Current locale
   */
  locale: Ref<string>
  
  /**
   * Available locales
   */
  locales: string[]
  
  /**
   * Set active locale
   */
  setLocale: (locale: string) => Promise<boolean>
  
  /**
   * Load translations for a locale
   */
  loadTranslations: (locale: string) => Promise<Record<string, string>>
  
  /**
   * Translation function
   */
  t: TranslateFunction
}