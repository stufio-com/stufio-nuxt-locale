import { translationCache } from "./translationCache";

export async function preloadTranslations(config: any) {
  if (!config.apiEndpoint) {
    console.log(
      "[stufio-i18n] Skipping translation preload: No API endpoint configured"
    );
    return;
  }

  console.log(
    "[stufio-i18n] 🚀 Preloading translations for all locales: " +
      config.locales.join(", ")
  );

  const preloadPromises = config.locales.map(async (locale: string) => {
    const baseEndpoint = config.apiEndpoint;
    const apiPath =
      baseEndpoint +
      "/api/v1/i18n/translations/locale/" +
      locale +
      "?module=" +
      config.moduleName;

    console.log("[stufio-i18n] Preloading translations from: " + apiPath);

    try {
      const response = await fetch(apiPath, {
        headers: {
          Accept: "application/json",
          ...(config.apiHeaders || {}),
        },
      });

      if (!response.ok) {
        console.error(
          "[stufio-i18n] Failed to preload translations for " +
            locale +
            ": " +
            response.status
        );
        return;
      }

      const data = await response.json();
      translationCache.set(locale, data);
      console.log(
        "[stufio-i18n] ✅ Preloaded " +
          Object.keys(data).length +
          " translations for " +
          locale
      );
    } catch (error) {
      console.error(
        "[stufio-i18n] Error preloading translations for " + locale + ":",
        error
      );
    }
  });

  await Promise.all(preloadPromises);
}
