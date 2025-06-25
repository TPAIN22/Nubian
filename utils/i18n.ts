import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const i18n = new I18n({
  en,
  ar,
});

export const LANGUAGE_KEY = 'APP_LANGUAGE';

export const setInitialLanguage = async () => {
  const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
    i18n.locale = savedLang;
    const isRTL = savedLang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      await Updates.reloadAsync();
    }
  }
};

export const changeLanguage = async (lang: 'ar' | 'en') => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.locale = lang;
  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    await Updates.reloadAsync();
  } else {
    // إعادة تحميل النصوص فقط بدون إعادة تشغيل إذا لم يتغير الاتجاه
    // يمكن إضافة forceUpdate أو setState في RootLayout إذا لزم الأمر
  }
};

export default i18n; 