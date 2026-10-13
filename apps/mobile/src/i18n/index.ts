/**
 * Internationalization setup and device language detection.
 */

import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import tr from './tr.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

type LanguageCode = keyof typeof resources;

/**
 * Detect the device's language and fallback to Turkish if unsupported.
 */
function isLanguageCode(lang: string | null | undefined): lang is LanguageCode {
  return typeof lang === 'string' && lang in resources;
}

const getDeviceLanguage = (): LanguageCode => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const firstLocale = locales[0];
    const lang = firstLocale?.languageCode;
    if (isLanguageCode(lang)) {
      return lang;
    }
  }
  return 'tr';
};

void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'tr',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export { i18n };
