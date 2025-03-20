import { createResolver, defineNuxtModule, addServerHandler, addPlugin, addImportsDir } from 'nuxt/kit'
import { fileURLToPath } from 'url'
import type { LocaleOptions } from './types'

// Module options TypeScript interface definition
export interface ModuleOptions {
  defaultLocale: string
  locales: string[]
  apiEndpoint: string
  moduleName: string
  detectBrowserLocale: boolean
  cookieName: string
  apiHeaders?: Record<string, string>
}

export default defineNuxtModule<LocaleOptions>({
  meta: {
    name: 'stufio-nuxt-locale',
    configKey: 'stufioi18n',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    defaultLocale: 'en',
    locales: ['en'],
    apiEndpoint: '',
    moduleName: 'main',
    detectBrowserLocale: true,
    cookieName: 'locale'
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    // Ensure locales array has unique values
    options.locales = [...new Set(options.locales)]
    
    console.log('[stufio-i18n] Using locales:', options.locales)

    // Transpile runtime
    nuxt.options.build.transpile.push(runtimeDir)
    
    // Add plugins
    addPlugin(resolve('./runtime/plugins/i18n'))
    addPlugin(resolve('./runtime/plugins/i18n-meta'))
    
    // Store module options as an environment variable
    // This makes them accessible to server handlers
    nuxt.options.runtimeConfig.stufioi18nOptions = options
    
    // Store module options as an environment variable for server handlers
    // This ensures they can access the config
    process.env.STUFIO_I18N_CONFIG = JSON.stringify(options)

    // Log that we've set the environment variable
    console.log('[stufio-i18n] Set STUFIO_I18N_CONFIG environment variable:', 
      process.env.STUFIO_I18N_CONFIG)

    // Add server handlers - with proper setup to inject config
    const apiPathPrefix = options.apiPathPrefix || '/_stufio/i18n'
    
    addServerHandler({
      route: `${apiPathPrefix}/missing`,
      handler: resolve('./runtime/server/api/missing.post')
    })
    
    addServerHandler({
      route: `${apiPathPrefix}/translations`,
      handler: resolve('./runtime/server/api/translations.get')
    })

    // Register server middleware that preloads translations at startup
    addServerHandler({
      route: '/api/_stufio_preload',
      handler: resolve('./runtime/server/middleware/preload-translations')
    });

    // Register an internal hook to trigger preloading when Nitro server starts
    nuxt.hooks.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('compiled', () => {
        console.log('[stufio-i18n] 🔄 Server compiled, translations will be preloaded on first request')
      })
    })
    
    // Add runtime config
    nuxt.options.runtimeConfig.public.stufioi18n = options

    // Add imports directory
    addImportsDir(resolve('./utils'))
  }
})
