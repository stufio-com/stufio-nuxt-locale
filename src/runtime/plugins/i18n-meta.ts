import { defineNuxtPlugin, useState, useRuntimeConfig, watch } from '#imports'

/**
 * Plugin that provides i18n metadata and diagnostic information
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const options = config.public.stufioi18n
  
  // Get state from main i18n plugin - WITH DEFAULT VALUE to prevent undefined errors
  const i18nState = useState<{
    locale: string;
    translations: Record<string, Record<string, string>>;
    loadedLocales: Record<string, boolean>;
    missingKeys: Set<string>;
    pendingRequests: number;
  }>('stufio:i18n', () => ({
    locale: options?.defaultLocale || 'en',
    translations: {},
    loadedLocales: {},
    missingKeys: new Set(),
    pendingRequests: 0
  }))
  
  // Admin/diagnostic information
  const diagnostics = useState('stufio:i18n:meta', () => ({
    stats: {
      totalKeys: 0,
      missingCount: 0,
      lastUpdated: new Date().toISOString(),
    },
    // Flag indicating if diagnostics are enabled
    enabled: process.dev || process.env.STUFIO_I18N_DEBUG === 'true',
    // Locales information with completion percentage
    localeStats: {} as Record<string, { 
      loaded: boolean, 
      keyCount: number,
      missingCount: number,
      completionPercent: number 
    }>
  }))
  
  // Update stats when translations change - WITH SAFETY CHECKS
  const updateStats = () => {
    // Safely access properties with nullish coalescing
    const translations = i18nState.value?.translations || {}
    const missingKeys = i18nState.value?.missingKeys || new Set()
    
    // Get current locale with fallback
    const currentLocale = i18nState.value?.locale || options?.defaultLocale || 'en'
    const localeTranslations = translations[currentLocale] || {}
    const keyCount = Object.keys(localeTranslations).length
    
    // Update diagnostics
    diagnostics.value.stats.totalKeys = keyCount
    diagnostics.value.stats.missingCount = missingKeys.size
    diagnostics.value.stats.lastUpdated = new Date().toISOString()
    
    // Update locale stats
    Object.keys(translations).forEach(locale => {
      const localeKeys = Object.keys(translations[locale] || {}).length
      const localeMissing = Array.from(missingKeys)
        .filter(k => typeof k === 'string' && k.startsWith(`${locale}:`))
        .length
      
      diagnostics.value.localeStats[locale] = {
        loaded: !!i18nState.value?.loadedLocales?.[locale],
        keyCount: localeKeys,
        missingCount: localeMissing,
        completionPercent: localeKeys > 0 
          ? Math.round(100 * (1 - (localeMissing / localeKeys))) 
          : 0
      }
    })
  }
  
  // Only attempt to update stats if we have i18nState
  if (diagnostics.value.enabled && i18nState.value) {
    try {
      updateStats()
      
      // Create a watcher to track changes - with delayed setup to ensure Vue is ready
      nuxtApp.hook('app:created', () => {
        try {
          watch(() => i18nState.value, updateStats, { deep: true })
        } catch (err) {
          console.error('[i18n-meta] Error setting up watcher:', err)
        }
      })
    } catch (err) {
      console.error('[i18n-meta] Error in initial updateStats:', err)
    }
  }
  
  // Provide utilities for debugging and diagnostics
  return {
    provide: {
      i18nMeta: {
        isDebugEnabled: () => diagnostics.value.enabled,
        enableDebug: () => {
          diagnostics.value.enabled = true
          updateStats()
        },
        disableDebug: () => {
          diagnostics.value.enabled = false
        },
        getStats: () => diagnostics.value.stats,
        getLocaleStats: () => diagnostics.value.localeStats,
        getDiagnostics: () => ({
          ...diagnostics.value,
          pendingRequests: i18nState.value?.pendingRequests || 0,
          currentLocale: i18nState.value?.locale || options?.defaultLocale || 'en',
          availableLocales: options?.locales || ['en'],
          loadedLocales: Object.keys(i18nState.value?.loadedLocales || {})
            .filter(locale => i18nState.value?.loadedLocales?.[locale])
        })
      }
    }
  }
})