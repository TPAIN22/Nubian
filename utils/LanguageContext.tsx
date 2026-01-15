import React, { createContext, useState, useEffect, useCallback } from 'react';
import i18n, { setInitialLanguage, changeLanguage, SupportedLanguage } from './i18n';
import { I18nManager, Platform } from 'react-native';

export const LanguageContext = createContext({
  language: 'en' as SupportedLanguage,
  setLanguage: (_lang: SupportedLanguage) => {},
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    setInitialLanguage().then(() => {
      const initialLang = i18n.locale as SupportedLanguage;
      setLanguageState(initialLang);
      const isRTL = initialLang.startsWith('ar');
      try {
        I18nManager.allowRTL(true);
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
        }
      } catch {}
      if (Platform.OS === 'web') {
        try {
          // @ts-ignore
          if (typeof document !== 'undefined') {
            // @ts-ignore
            document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
          }
        } catch {}
      }
    });
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    changeLanguage(lang, () => {
      setLanguageState(lang);
      const isRTL = lang.startsWith('ar');
      try {
        I18nManager.allowRTL(true);
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.forceRTL(isRTL);
        }
      } catch {}
      if (Platform.OS === 'web') {
        try {
          // @ts-ignore
          if (typeof document !== 'undefined') {
            // @ts-ignore
            document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
          }
        } catch {}
      }
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 