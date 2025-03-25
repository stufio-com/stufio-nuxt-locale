import { defineEventHandler, getQuery } from 'h3'
import { translationCache } from '../utils/translationCache'

// Update your server handler
export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const locale = query.locale?.toString()
    
    // Get config from environment variable 
    let config = {
      moduleName: 'admin',
      apiEndpoint: '',
      apiHeaders: {}
    }
    
    // Try to parse config from environment variable
    try {
      if (process.env.STUFIO_I18N_CONFIG) {
        const envConfig = JSON.parse(process.env.STUFIO_I18N_CONFIG)
        if (envConfig && typeof envConfig === 'object') {
          config = { ...config, ...envConfig }
        }
      }
    } catch (envError) {
      console.error('[stufio-i18n] Error parsing config from env:', envError)
    }
    
    // Get module name either from query or config
    const moduleName = query.module?.toString() || config.moduleName || 'admin'
    
    if (!locale) {
      return { error: 'Missing locale parameter' }
    }

    if (!config.apiEndpoint) {
      console.error('[stufio-i18n] API endpoint is not configured')
      return { error: 'API configuration missing' }
    }
    
    // Always check cache first
    const cacheMaxAge = 3600000; // 1 hour in milliseconds
    if (translationCache.has(locale) && translationCache.age(locale) < cacheMaxAge) {
      // If this is an internal cache request, reduce logging
      if (process.dev) {
        console.log(`[stufio-i18n] Using cached translations for ${locale}`)
      }
      return translationCache.get(locale);
    } else {
      console.log(`[stufio-i18n] Cache miss for ${locale}`)
      if (translationCache.has(locale)) {
        console.log(`[stufio-i18n] Cache expired for ${locale}, it's age is ${translationCache.age(locale)}ms`)
      }
    }
    
    try {
      // If not cached or cache expired, fetch from API
      const baseEndpoint = config.apiEndpoint
      const apiPath = `${baseEndpoint}/api/v1/i18n/translations/locale/${locale}?module=${moduleName}`;
      
      console.log(`[stufio-i18n] Fetching translations from: ${apiPath}`)
      
      // Use configured headers
      const headers = {
        'Accept': 'application/json',
        ...(config.apiHeaders || {})
      }
      
      const response = await fetch(apiPath, { headers })
      
      if (!response.ok) {
        let errorDetail;
        try {
          errorDetail = await response.json();
        } catch {
          errorDetail = await response.text();
        }
        console.error('[stufio-i18n] API responded with status:', errorDetail)
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Cache the translations
      translationCache.set(locale, data)
      
      return data
    } catch (fetchError) {
      console.error('[stufio-i18n] Error fetching translations:', fetchError)
      return { 
        error: 'Failed to fetch translations',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }
    }
  } catch (error) {
    console.error('[stufio-i18n] Server handler error:', error)
    return { 
      error: 'An error occurred processing the request',
      message: error instanceof Error ? error.message : 'Unknown error'  
    }
  }
})