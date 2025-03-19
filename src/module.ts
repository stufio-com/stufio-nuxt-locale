import { defineNuxtModule, createResolver, addPlugin, addServerHandler } from '@nuxt/kit'
import { fileURLToPath } from 'url'

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

export default defineNuxtModule<ModuleOptions>({
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
    apiEndpoint: '/api/v1/i18n/translations/locale',
    moduleName: 'main',
    detectBrowserLocale: true,
    cookieName: 'locale'
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))

    // Add runtime stuff to Nuxt
    nuxt.options.build.transpile.push(runtimeDir)
    
    // Add server handlers for API proxying
    addServerHandler({
      route: '/api/_stufio/i18n/translations',
      handler: resolver.resolve('./runtime/server/api/translations.get.ts')
    })
    
    addServerHandler({
      route: '/api/_stufio/i18n/missing-key',
      handler: resolver.resolve('./runtime/server/api/missing.post.ts')
    })
    
    // Add plugins
    addPlugin({
      src: resolver.resolve('./runtime/plugins/i18n.ts'),
      mode: 'all' // Works in both client and server
    })
    
    // Provide module options to runtime config
    nuxt.options.runtimeConfig.public.stufioi18n = options
  }
})
