import { useState, useNuxtApp } from '#imports'

export const useTranslations = () => {
  const { $t, $i18n } = useNuxtApp()
  const i18nState = useState('stufio:i18n')
  
  return {
    t: $t,
    locale: i18nState.value.locale,
    setLocale: $i18n.setLocale,
    locales: $i18n.locales,
    loadTranslations: $i18n.loadTranslations
  }
}