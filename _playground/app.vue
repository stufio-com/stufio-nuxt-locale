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
