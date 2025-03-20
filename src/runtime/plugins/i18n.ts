import { defineNuxtPlugin, useState, useRuntimeConfig, useRequestHeaders } from '#imports'
import { parseAcceptLanguage } from '../../utils'

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
    let detectedLocale = options.defaultLocale
    
    // Check cookie first
    if (headers.cookie && options.cookieName) {
      const cookieMatch = new RegExp(`${options.cookieName}=([^;]+)`).exec(headers.cookie)
      if (cookieMatch && options.locales.includes(cookieMatch[1])) {
        detectedLocale = cookieMatch[1]
        // Reduce visible logs
        if (process.dev) {
          console.log(`[i18n] Detected locale from cookie: ${detectedLocale}`)
        }
      }
    }
    
    // Then try Accept-Language header if cookie wasn't found
    if (detectedLocale === options.defaultLocale && headers['accept-language'] && options.detectBrowserLocale) {
      const acceptLanguage = headers['accept-language']
      const browserLocale = parseAcceptLanguage(acceptLanguage, options.locales)
      if (browserLocale) {
        detectedLocale = browserLocale
        // Reduce visible logs
        if (process.dev) {
          console.log(`[i18n] Detected locale from browser: ${detectedLocale}`)
        }
      }
    }
    
    // Set the detected locale
    i18nState.value.locale = detectedLocale
  }
  
  // Load translations for a locale
  const loadTranslations = async (locale: string) => {
    // Don't reload if already loaded in client state
    if (i18nState.value.loadedLocales[locale]) {
      if (process.dev) {
        console.log(`[i18n] Translations for ${locale} already loaded in state, skipping fetch`)
      }
      return i18nState.value.translations[locale] || {}
    }
    
    try {
      // Different approach for client vs server
      let translations;
      
      // On server, try to use the HTTP endpoint which will use the server cache
      if (process.server) {
        const apiUrl = `/_stufio/i18n/translations?locale=${locale}&module=${options.moduleName}`
        
        // Reduce visible logs
        if (process.dev) {
          console.log(`[i18n] Server: Fetching from cached endpoint: ${apiUrl}`)
        }
        
        translations = await $fetch(apiUrl, {
          // Add a cache flag to hint our server handler this is an internal request
          headers: { 'X-Stufio-I18n-Cache': 'true' }
        })
      }
      // On client, use the internal proxy
      else {
        const apiUrl = `/_stufio/i18n/translations?locale=${locale}&module=${options.moduleName}`
        console.log(`[i18n] Client: Fetching translations from: ${apiUrl}`)
        translations = await $fetch(apiUrl)
      }
      
      if (translations && typeof translations === 'object') {
        // Reduce visible logs on server
        if (process.client || process.dev) {
          console.log(`[i18n] Loaded ${Object.keys(translations).length} translations for ${locale}`)
        }
        
        i18nState.value.translations[locale] = translations
        i18nState.value.loadedLocales[locale] = true
        return translations
      } else {
        console.error(`[i18n] Invalid translations response:`, translations)
        return {}
      }
    } catch (error) {
      console.error(`[i18n] Failed to load translations for ${locale}:`, error)
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
      await $fetch('/_stufio/i18n/missing', {
        method: 'POST',
        body: {
          locale,
          key,
          module: options.moduleName
        }
      })
    } catch (error) {
      console.error('[i18n] Failed to report missing translation:', error)
    }
  }
  
  // Set locale and load translations if needed
  const setLocale = async (locale: string) => {
    if (!options.locales.includes(locale)) {
      console.warn(`[i18n] Locale ${locale} is not supported`)
      return false
    }
    
    console.log(`[i18n] Setting locale to: ${locale}`)
    
    // Load translations if not already loaded
    if (!i18nState.value.loadedLocales[locale]) {
      await loadTranslations(locale)
    }
    
    i18nState.value.locale = locale
    
    // Set cookie for persistence
    if (process.client) {
      document.cookie = `${options.cookieName}=${locale};path=/;max-age=31536000`
    }
    
    return true
  }
  
  // Load initial translations on the server with minimal logging
  if (process.server) {
    // Reduce visible logs
    if (process.dev) {
      console.log(`[i18n] Server: Loading initial translations for ${i18nState.value.locale}`)
    }
    
    const serverTranslations = await loadTranslations(i18nState.value.locale)
    
    // Reduce visible logs
    if (process.dev) {
      console.log(`[i18n] Server: Loaded ${Object.keys(serverTranslations).length} translations`)
    }
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