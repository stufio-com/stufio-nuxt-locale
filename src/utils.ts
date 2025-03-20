import type { LocaleOptions } from './types'

/**
 * Parse Accept-Language header to find the best matching locale
 */
export function parseAcceptLanguage(acceptLanguage: string, availableLocales: string[]): string | null {
  if (!acceptLanguage) return null
  
  // Split the string on commas and sort by quality value
  const locales = acceptLanguage.split(',')
    .map(str => {
      const [locale, qualityStr] = str.trim().split(';q=')
      const quality = qualityStr ? parseFloat(qualityStr) : 1.0
      return { locale: locale.split('-')[0], quality }
    })
    .sort((a, b) => b.quality - a.quality)
  
  // Find the first available locale
  const match = locales.find(l => availableLocales.includes(l.locale))
  return match ? match.locale : null
}

/**
 * Format a translation key for display (fallback for missing translations)
 */
export function formatTranslationKey(key: string): string {
  return key.split('.').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')
}

/**
 * Interpolate values into a translation string
 * Handles {param} style placeholders
 */
export function interpolate(text: string, params?: Record<string, any>): string {
  if (!params) return text
  
  return text.replace(/{([^{}]*)}/g, (matched, key) => {
    const value = params[key]
    return value !== undefined ? String(value) : matched
  })
}

/**
 * Validate module options
 */
export function validateOptions(options: Partial<LocaleOptions>): LocaleOptions {
  return {
    defaultLocale: options.defaultLocale || 'en',
    locales: options.locales || ['en'],
    apiEndpoint: options.apiEndpoint || '',
    moduleName: options.moduleName || 'main',
    detectBrowserLocale: options.detectBrowserLocale !== false,
    cookieName: options.cookieName || 'locale',
    apiHeaders: options.apiHeaders || {},
    apiPathPrefix: options.apiPathPrefix || '/_stufio/i18n'
  }
}

/**
 * Pluralize a string based on count
 */
export function pluralize(
  count: number, 
  singular: string, 
  plural: string, 
  zero?: string
): string {
  if (count === 0 && zero !== undefined) return zero
  return count === 1 ? singular : plural
}

/**
 * Get value from a nested object using dot notation
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined
  }, obj)
}

/**
 * Creates a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }
}