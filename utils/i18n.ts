import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import AsyncStorage from "@react-native-async-storage/async-storage";

const translations = { en, ar };
export type SupportedLanguage = keyof typeof translations;
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = Object.keys(
  translations
) as SupportedLanguage[];

const i18n = new I18n(translations);

export const LANGUAGE_KEY = "APP_LANGUAGE";

/**
 * يحدد اللغة عند أول تشغيل أو يعيد اللغة المحفوظة
 */
export const setInitialLanguage = async () => {
  try {
    let savedLang = (await AsyncStorage.getItem(
      LANGUAGE_KEY
    )) as SupportedLanguage | null;

    if (!savedLang || !SUPPORTED_LANGUAGES.includes(savedLang)) {
      // استخدام لغة الجهاز أو الافتراضية 'en'

      const locales = Localization.getLocales();
      const deviceLang =
        locales.length > 0 && locales[0] !== undefined
          ? (locales[0].languageCode as SupportedLanguage)
          : "en";
      savedLang = SUPPORTED_LANGUAGES.includes(deviceLang) ? deviceLang : "en";
      await AsyncStorage.setItem(LANGUAGE_KEY, savedLang);
    }

    i18n.locale = savedLang;
    const isRTL = savedLang === "ar";

    // تفعيل أو تعطيل RTL
    I18nManager.allowRTL(isRTL);

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      await Updates.reloadAsync(); // إعادة تشغيل لتطبيق الاتجاه
    }
  } catch (error) {
    console.error("Error setting initial language:", error);
  }
};

/**
 * تغيير اللغة يدويًا
 */
export const changeLanguage = async (
  lang: SupportedLanguage,
  onLanguageChanged?: () => void
) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    i18n.locale = lang;
    const isRTL = lang === "ar";

    // تفعيل أو تعطيل RTL
    I18nManager.allowRTL(isRTL);

    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      await Updates.reloadAsync(); 
    } else {
      onLanguageChanged?.();
    }
  } catch (error) {
    console.error("Error changing language:", error);
  }
};

export default i18n;
