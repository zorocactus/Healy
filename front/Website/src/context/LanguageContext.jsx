import React, { createContext, useContext, useState, useEffect } from 'react';
import fr from '../locales/fr.js';
import en from '../locales/en.js';

const LanguageContext = createContext();

const locales = { fr, en };

// Traverse a nested object with a dot-notation path.
// e.g. get(obj, 'dashboard.doctor.nav.schedule') → obj.dashboard.doctor.nav.schedule
function get(obj, path) {
  return path.split('.').reduce((cur, key) => (cur != null ? cur[key] : undefined), obj);
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('Healy_lang') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('Healy_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, params = {}) => {
    const locale = locales[lang] || locales.fr;
    const fallback = locales.fr;

    let text;

    if (key.includes('.')) {
      // Dot-notation lookup: e.g. t('dashboard.doctor.nav.schedule')
      text = get(locale, key) ?? get(fallback, key) ?? null;
    } else {
      // Legacy flat key lookup via the `_` section
      text = locale._?.[key] ?? fallback._?.[key] ?? null;
    }

    if (typeof text !== 'string') {
      if (import.meta.env.DEV && text !== null) {
        console.warn(`t("${key}") resolved to a non-string value.`, text);
      }
      // Retourne null pour que `t('key') || "Fallback"` utilise le fallback
      return null;
    }

    // {{param}} interpolation
    return Object.keys(params).reduce(
      (str, p) => str.replace(new RegExp(`\\{\\{${p}\\}\\}`, 'g'), params[p]),
      text
    );
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
