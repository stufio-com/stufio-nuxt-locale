# stufio-nuxt-locale

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

Lightweight i18n module for Nuxt 3 with dynamic API-based translations loading.

- ✨ &nbsp;Release Notes
<!-- - [🏀 Online playground](https://stackblitz.com/github/stufio-com/stufio-nuxt-locale?file=playground%2Fapp.vue) -->

## Features

- 🔄 **Dynamic Loading** - Load translations from your API instead of static files
- 🚀 **Server-side Ready** - Pre-loads translations during SSR for optimal performance
- 🔍 **Auto-detection** - Detects user's preferred language from browser or cookies
- 🧩 **Missing Keys Handling** - Automatically reports missing translations to your API
- 🔌 **Simple Integration** - Easy to set up with minimal configuration
- 🌐 **Full i18n Support** - Parameter interpolation, pluralization, and more
- 📦 **Lightweight** - No dependencies on heavy i18n libraries

## Quick Setup

1. Install the module to your Nuxt application:

```bash
# npm
npm install stufio-nuxt-locale

# yarn
yarn add stufio-nuxt-locale

# pnpm
pnpm add stufio-nuxt-locale
```

2. Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    'stufio-nuxt-locale'
  ],
  stufioi18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'es'],
    apiEndpoint: '/api/v1/i18n/translations/locale',
    moduleName: 'web'
  }
})
```

3. Create server API endpoints (optional, for API proxying):

```ts
// server/api/_i18n/get-translations.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  
  // Forward request to your translation API
  return await $fetch(`${config.apiUrl}/translations/${query.locale}`, {
    params: { module: query.module_name },
    headers: {
      'X-API-Key': config.apiKey
    }
  })
})
```

## Configuration

```ts
export default defineNuxtConfig({
  stufioi18n: {
    // The default locale to use if none is detected
    defaultLocale: 'en',
    
    // Available locales in your application
    locales: ['en', 'ru', 'es'],
    
    // Your API endpoint for loading translations
    apiEndpoint: '/api/v1/i18n/translations/locale',
    
    // Module name to fetch specific translations for
    moduleName: 'web',
    
    // Whether to detect browser language
    detectBrowserLocale: true,
    
    // Cookie name for storing locale preference
    cookieName: 'locale',
    
    // Headers to send with API requests
    apiHeaders: {
      'X-API-Secret': process.env.API_SECRET,
      'X-API-Client': 'web-client'
    }
  }
})
```

## Usage

### Basic Translation

```vue
<template>
  <div>
    <h1>{{ $t('welcome.title') }}</h1>
    <p>{{ $t('welcome.description', { name: user.name }) }}</p>
  </div>
</template>
```

### Using the Composable

```vue
<template>
  <div>
    <h1>{{ t('welcome.title') }}</h1>
    
    <select v-model="currentLocale" @change="updateLocale">
      <option v-for="loc in locales" :key="loc" :value="loc">
        {{ loc.toUpperCase() }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { useTranslations } from 'stufio-nuxt-locale/composables'

const { t, locale: currentLocale, setLocale, locales } = useTranslations()

const updateLocale = async () => {
  await setLocale(currentLocale)
}
</script>
```

### API Methods

The module provides the following composables and methods:

```ts
// Global
$t(key, params) // Translate a key with optional parameters
$i18n.setLocale(locale) // Change the current locale
$i18n.locales // Array of available locales
$i18n.locale // Current locale

// Composables
const { t, locale, setLocale, locales } = useTranslations()
```

## Handling Missing Translations

When a translation is missing, the module will:

1. Return the key itself (for English) or an empty string (for other locales)
2. Automatically send a request to report the missing key to your API
3. Cache missing keys to avoid duplicate requests

You can implement a server endpoint to handle these reports:

```ts
// server/api/_i18n/update-key.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  
  // Send missing key to your translation management system
  await $fetch(`${config.apiUrl}/translations/missing`, {
    method: 'POST',
    body,
    headers: {
      'X-API-Key': config.apiKey
    }
  })
  
  return { success: true }
})
```

## Advanced Usage

### Server-side Translations Pre-loading

The module automatically pre-loads translations during server-side rendering, but you can also manually trigger it:

```ts
// In a plugin or middleware
const { $i18n } = useNuxtApp()
await $i18n.loadTranslations('en')
```

### Debugging Missing Translations

Add this component to your app during development to track missing keys:

```vue
<template>
  <div v-if="showDebug" class="i18n-debug">
    <h3>Missing Translations</h3>
    <ul>
      <li v-for="key in missingKeys" :key="key">{{ key }}</li>
    </ul>
  </div>
</template>

<script setup>
const { missingKeys } = useTranslations()
const showDebug = process.dev // Only show in development
</script>
```

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/stufio-nuxt-locale/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/stufio-nuxt-locale

[npm-downloads-src]: https://img.shields.io/npm/dm/stufio-nuxt-locale.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/stufio-nuxt-locale

[license-src]: https://img.shields.io/npm/l/stufio-nuxt-locale.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/stufio-nuxt-locale

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com

Similar code found with 2 license types