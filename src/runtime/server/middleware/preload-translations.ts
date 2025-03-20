import { defineEventHandler } from 'h3'
import { translationCache } from '../utils/translationCache'

// This flag ensures we only preload translations once
let hasPreloaded = false;

export default defineEventHandler(async (event) => {
  // Only run this once on server startup
  if (hasPreloaded || process.client) {
    return;
  }
  
  try {
    let config = {
      locales: ['en'],
      moduleName: 'admin',
      apiEndpoint: '',
      apiHeaders: {}
    }
    
    // Parse config from environment variable
    try {
      if (process.env.STUFIO_I18N_CONFIG) {
        const envConfig = JSON.parse(process.env.STUFIO_I18N_CONFIG)
        if (envConfig && typeof envConfig === 'object') {
          config = { ...config, ...envConfig }
        }
      }
    } catch (envError) {
      console.error('[stufio-i18n] Error parsing config for preload:', envError)
    }
    
    // Skip if no API endpoint is configured
    if (!config.apiEndpoint) {
      console.log('[stufio-i18n] Skipping translation preload: No API endpoint configured')
      hasPreloaded = true;
      return;
    }
    
    console.log(`[stufio-i18n] 🚀 Preloading translations for all locales: ${config.locales.join(', ')}`)
    
    // Preload translations for all locales
    const preloadPromises = config.locales.map(async (locale) => {
      const baseEndpoint = config.apiEndpoint
      const apiPath = `${baseEndpoint}/api/v1/i18n/translations/locale/${locale}?module=${config.moduleName}`;
      
      console.log(`[stufio-i18n] Preloading translations from: ${apiPath}`)
      
      try {
        const response = await fetch(apiPath, {
          headers: {
            'Accept': 'application/json',
            ...(config.apiHeaders || {})
          }
        })
        
        if (!response.ok) {
          console.error(`[stufio-i18n] Failed to preload translations for ${locale}: ${response.status}`)
          return;
        }
        
        const data = await response.json()
        translationCache.set(locale, data)
        console.log(`[stufio-i18n] ✅ Preloaded ${Object.keys(data).length} translations for ${locale}`)
      } catch (error) {
        console.error(`[stufio-i18n] Error preloading translations for ${locale}:`, error)
      }
    });
    
    // Wait for all preloads to complete
    await Promise.all(preloadPromises);
    console.log(`[stufio-i18n] 🎉 All translations preloaded successfully!`)
    
    // Mark as preloaded to avoid duplicate work
    hasPreloaded = true;
  } catch (error) {
    console.error('[stufio-i18n] Error during translation preload:', error)
    hasPreloaded = true; // Mark as preloaded anyway to avoid repeated errors
  }
})