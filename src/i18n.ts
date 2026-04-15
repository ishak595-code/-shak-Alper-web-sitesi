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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'TR', // default language
    fallbackLng: 'EN',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
