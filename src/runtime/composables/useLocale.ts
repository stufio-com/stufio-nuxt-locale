import { useState, useNuxtApp, useRuntimeConfig, useCookie, useRequestHeaders } from '#imports'
import type { LocaleOptions } from '../../types'

/**
 * Composable for managing the application locale
 */
export const useLocale = () => {
  const { $i18n } = useNuxtApp()
  const config = useRuntimeConfig()
  const options = config.public.stufioi18n as LocaleOptions
  
  // Get locale state
  const i18nState = useState('stufio:i18n')
  
  // Get current locale
  const locale = computed(() => i18nState.value.locale)
  
  // Get available locales
  const locales = computed(() => options.locales || ['en'])
  
  /**
   * Set the application locale and load translations if needed
   */
  const setLocale = async (newLocale: string) => {
    // Validate locale
    if (!options.locales.includes(newLocale)) {
      console.warn(`Locale ${newLocale} is not supported. Available locales: ${options.locales.join(', ')}`)
      return false
    }
    
    // Check if we need to load translations
    if (!i18nState.value.loadedLocales?.[newLocale]) {
      await $i18n.loadTranslations(newLocale)
    }
    
    // Set the new locale
    i18nState.value.locale = newLocale
    
    // Save to cookie for persistence
    if (process.client) {
      useCookie(options.cookieName || 'locale').value = newLocale
    }
    
    return true
  }
  
  /**
   * Detect the user's preferred locale
   */
  const detectLocale = (): string => {
    // Default to the configured default locale
    let detectedLocale = options.defaultLocale || 'en'
    
    if (options.detectBrowserLocale !== false) {
      if (process.client) {
        // Check cookie first
        const cookieName = options.cookieName || 'locale'
        const cookieLocale = useCookie(cookieName).value
        
        if (cookieLocale && options.locales.includes(cookieLocale)) {
          return cookieLocale
        }
        
        // Then check navigator.language
        const navLang = navigator.language.split('-')[0]
        if (navLang && options.locales.includes(navLang)) {
          return navLang
        }
      } else if (process.server) {
        // On server, check Accept-Language header and cookie
        const headers = useRequestHeaders(['cookie', 'accept-language'])
        
        // Check cookie first
        const cookieName = options.cookieName || 'locale'
        const cookies = headers.cookie || ''
        const match = new RegExp(`${cookieName}=([^;]+)`).exec(cookies)
        const cookieLocale = match ? match[1] : null
        
        if (cookieLocale && options.locales.includes(cookieLocale)) {
          return cookieLocale
        }
        
        // Then check Accept-Language header
        const acceptLanguage = headers['accept-language'] || ''
        const acceptedLocales = acceptLanguage
          .split(',')
          .map(item => item.split(';')[0].trim().split('-')[0])
          .filter(locale => options.locales.includes(locale))
        
        if (acceptedLocales.length > 0) {
          return acceptedLocales[0]
        }
      }
    }
    
    return detectedLocale
  }
  
  /**
   * Format a locale for display
   */
  const formatLocale = (localeCode: string): string => {
    try {
      return new Intl.DisplayNames([localeCode], { type: 'language' }).of(localeCode) || localeCode
    } catch (e) {
      return localeCode
    }
  }
  
  return {
    locale,
    locales,
    setLocale,
    detectLocale,
    formatLocale,
    defaultLocale: options.defaultLocale || 'en'
  }
}