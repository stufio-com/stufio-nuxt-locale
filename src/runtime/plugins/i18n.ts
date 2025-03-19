import { defineNuxtPlugin, useState, useRuntimeConfig, useRequestHeaders } from '#imports'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  const options = config.public.stufioi18n
  
  // State for translations and locale
  const i18nState = useState('stufio:i18n', () => ({
    locale: options.defaultLocale,
    translations: {} as Record<string, Record<string, string>>,
    loadedLocales: {} as Record<string, boolean>,
    missingKeys: new Set<string>()
  }))
  
  // Detect initial locale
  if (process.server) {
    // From cookie or Accept-Language header
    const headers = useRequestHeaders(['cookie', 'accept-language'])
    // Implement locale detection logic here
    // ...
  }
  
  // Load translations for a locale
  const loadTranslations = async (locale: string) => {
    // Don't reload if already loaded
    if (i18nState.value.loadedLocales[locale]) return
    
    try {
      const translations = await $fetch(`/api/_stufio/i18n/translations`, {
        params: { locale, module: options.moduleName }
      })
      
      i18nState.value.translations[locale] = translations
      i18nState.value.loadedLocales[locale] = true
      
      return translations
    } catch (error) {
      console.error(`Failed to load translations for ${locale}:`, error)
      return {}
    }
  }
  
  // Translation function
  const t = (key: string, params?: Record<string, any>) => {
    const locale = i18nState.value.locale
    const translations = i18nState.value.translations[locale] || {}
    
    // Get translation
    let translation = translations[key]
    
    // If not found, record as missing and return fallback
    if (!translation) {
      handleMissingTranslation(locale, key)
      translation = locale === 'en' ? key : ''
    }
    
    // Handle parameter interpolation
    if (params && translation) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value))
      })
    }
    
    return translation
  }
  
  // Handle missing translations
  const handleMissingTranslation = async (locale: string, key: string) => {
    // Avoid duplicate reporting
    const cacheKey = `${locale}:${key}`
    if (i18nState.value.missingKeys.has(cacheKey)) return
    
    i18nState.value.missingKeys.add(cacheKey)
    
    // Don't send API requests during SSR to avoid slowing down rendering
    if (process.server) return
    
    // Report missing key to API
    try {
      await $fetch('/api/_stufio/i18n/missing-key', {
        method: 'POST',
        body: {
          locale,
          key,
          module: options.moduleName
        }
      })
    } catch (error) {
      console.error('Failed to report missing translation:', error)
    }
  }
  
  // Set locale and load translations if needed
  const setLocale = async (locale: string) => {
    if (!options.locales.includes(locale)) {
      console.warn(`Locale ${locale} is not supported`)
      return
    }
    
    // Load translations if not already loaded
    if (!i18nState.value.loadedLocales[locale]) {
      await loadTranslations(locale)
    }
    
    i18nState.value.locale = locale
    
    // Set cookie for persistence
    if (process.client) {
      document.cookie = `${options.cookieName}=${locale};path=/;max-age=31536000`
    }
  }
  
  // Load initial translations on the server
  if (process.server) {
    await loadTranslations(i18nState.value.locale)
  }
  
  // Provide API
  return {
    provide: {
      t,
      i18n: {
        locale: i18nState.value.locale,
        locales: options.locales,
        setLocale,
        loadTranslations,
        t
      }
    }
  }
})