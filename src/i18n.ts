import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationTR from './locales/tr.json';
import translationEN from './locales/en.json';
import translationKU from './locales/ku.json';
import translationFR from './locales/fr.json';
import translationDE from './locales/de.json';
import translationES from './locales/es.json';
import translationAR from './locales/ar.json';
import translationRU from './locales/ru.json';
import translationZH from './locales/zh.json';
import translationIT from './locales/it.json';

const resources = {
  TR: { translation: translationTR },
  EN: { translation: translationEN },
  KU: { translation: translationKU },
  FR: { translation: translationFR },
  DE: { translation: translationDE },
  ES: { translation: translationES },
  AR: { translation: translationAR },
  RU: { translation: translationRU },
  ZH: { translation: translationZH },
  IT: { translation: translationIT }
};

// Auto-detect browser language
const getInitialLanguage = () => {
  try {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && resources[savedLang as keyof typeof resources]) {
      return savedLang;
    }
    
    // Fallback to browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.substring(0, 2).toUpperCase();
      if (resources[browserLang as keyof typeof resources]) {
        // Automatically save detected browser lang on first load
        try {
          localStorage.setItem('app_language', browserLang);
        } catch (e) {}
        return browserLang;
      }
    }
  } catch (error) {
    console.error('Error determining initial language:', error);
  }
  
  return 'TR'; // default fallback
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // use auto-detect logic
    fallbackLng: 'EN',
    interpolation: {
      escapeValue: false
    }
  });

// Save chosen language to persist it across reloads
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('app_language', lng);
  } catch (error) {}
});

export default i18n;
