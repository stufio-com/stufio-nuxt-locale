import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Read request body
    const body = await readBody(event)
    
    // Get config from environment variable - SAME APPROACH as translations.get.ts
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
    
    // Validate required fields
    const { locale, key, module } = body
    
    if (!locale || !key) {
      return { error: 'Missing required fields: locale and key are required' }
    }
    
    // Default fallback value for this locale if not provided
    const value = body.value || (locale === 'en' ? key : '')
    
    if (!config.apiEndpoint) {
      console.error('[stufio-i18n] API endpoint is not configured')
      return { error: 'API configuration missing' }
    }
    
    // Log the request in dev mode
    console.log(`[stufio-i18n] Reporting missing key: "${key}" for locale: "${locale}"`)
    
    try {
      // Construct the URL correctly - SAME LOGIC as translations.get.ts
      const baseEndpoint = config.apiEndpoint
      const url = `${baseEndpoint}/api/v1/internal/i18n/translations`;
      
      console.log(`[stufio-i18n] Posting missing translation to: ${url}`)
      
      // Use configured headers - SAME APPROACH as translations.get.ts
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.apiHeaders || {})
      }

      console.log(`[stufio-i18n] Using headers:`, headers)
      
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          locale,
          key,
          value,
          module: module || config.moduleName || 'admin'
        }),
        headers
      })
      
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
      
      const result = await response.json()
      return { success: true, response: result }
    } catch (fetchError) {
      console.error('[stufio-i18n] Error calling API:', fetchError)
      return { 
        success: false, 
        error: 'API request failed',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }
    }
  } catch (error) {
    console.error('[stufio-i18n] Error reporting missing translation:', error)
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
})