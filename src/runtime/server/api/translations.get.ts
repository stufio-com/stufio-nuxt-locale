import { defineEventHandler, getQuery, useRuntimeConfig } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  const options = config.public.stufioi18n
  
  const locale = query.locale?.toString()
  const module = query.module?.toString() || options.moduleName
  
  if (!locale) {
    return { error: 'Missing locale parameter' }
  }
  
  try {
    // Use either internal or public base URL
    const apiBaseURL = config.apiInternalBaseURL || config.public.apiBaseURL
    const url = `${apiBaseURL}${options.apiEndpoint}/${locale}`
    
    const result = await $fetch(url, {
      method: 'GET',
      params: { module },
      headers: options.apiHeaders || {}
    })
    
    return result
  } catch (error) {
    console.error(`Failed to fetch translations for ${locale}:`, error)
    return { error: 'Failed to fetch translations' }
  }
})