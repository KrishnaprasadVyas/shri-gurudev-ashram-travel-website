import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import mrCommon from './locales/mr/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enCommon },
      hi: { translation: hiCommon },
      mr: { translation: mrCommon },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'mr'],
    load: 'languageOnly',
    returnEmptyString: false,
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

// Synchronize document.documentElement.lang
const syncDocumentLang = (lng?: string) => {
  const code = (lng || i18n.language || 'en').split('-')[0].toLowerCase();
  const validLang = ['en', 'hi', 'mr'].includes(code) ? code : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = validLang;
  }
};

syncDocumentLang(i18n.language);

i18n.on('languageChanged', (lng: string) => {
  syncDocumentLang(lng);
  try {
    const code = lng.split('-')[0].toLowerCase();
    const validLang = ['en', 'hi', 'mr'].includes(code) ? code : 'en';
    localStorage.setItem('i18nextLng', validLang);
  } catch {
    // ignore storage exceptions in restricted environments
  }
});

export default i18n;
