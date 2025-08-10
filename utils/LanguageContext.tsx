import React, { createContext, useState, useEffect, useCallback } from 'react';
import i18n, { setInitialLanguage, changeLanguage, SupportedLanguage } from './i18n';

export const LanguageContext = createContext({
  language: 'en' as SupportedLanguage,
  setLanguage: (lang: SupportedLanguage) => {},
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    setInitialLanguage().then(() => {
      setLanguageState(i18n.locale as SupportedLanguage);
    });
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    changeLanguage(lang, () => setLanguageState(lang));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 