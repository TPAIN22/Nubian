import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  I18nManager,
  Linking,
  Switch,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useNavigation, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import GoogleSignInSheet from "@/app/(auth)/signin";
import i18n, { changeLanguage } from "../../utils/i18n";
import Colors from "@/locales/brandColors";
import { useTheme } from "@/providers/ThemeProvider";
import CurrencySelector from "@/components/CurrencySelector";
import { useCurrencyStore } from "@/store/useCurrencyStore";

const { width } = Dimensions.get("window");

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const tabbarHeight = useBottomTabBarHeight();
  const { loaded, isSignedIn } = useClerk();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const navigation = useNavigation();
  const scrollY = useRef(0);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const { countryCode, currencyCode, countries, currencies } = useCurrencyStore();

  const currentCountry = countries.find(c => c.code === countryCode);
  const currentCurrency = currencies.find(c => c.code === currencyCode);


  // callbacks
  const handlePresentModalPress = useCallback(() => {
    //bottomSheetModalRef.current?.present();
    router.push("/signin");
  }, []);
  const handleSheetChanges = useCallback(() => { }, []);

  // العناصر التي تحتاج تسجيل دخول
  const userOnlyOptions = [
    {
      title: i18n.t("editProfile"),
      action: () => {
        router.push("/editProfile");
      },
      icon: "person-outline" as const,
      color: Colors.info,
    },
    {
      title: i18n.t("notifications"),
      action: () => {
        router.push("/notification");
      },
      icon: "notifications-outline" as const,
      color: Colors.yellow,
    },
    {
      title: i18n.t("orders"),
      action: () => {
        router.push("/order");
      },
      icon: "receipt-outline" as const,
      color: Colors.success,
    },
    {
      title: i18n.t("shippingAddresses"),
      action: () => {
        router.push("/addresses");
      },
      icon: "location-outline" as const,
      color: Colors.accent,
    },
  ];

  // العناصر المتاحة للجميع (بدون تسجيل دخول)
  const publicOptions = [
    {
      title: i18n.t("privacyPolicy"),

      action: () => {
        Linking.openURL("https://nubian-sd.store/privacy-policy");
      },
      icon: "shield-outline" as const,
      color: Colors.purple,
    },
    {
      title: i18n.t("security"),
      action: () => {
        // يمكن إضافة الوظيفة هنا
      },
      icon: "lock-closed-outline" as const,
      color: Colors.orange,
    },
    {
      title: i18n.t("support"),
      action: () => {
        Linking.openURL("https://nubian-sd.store");
      },
      icon: "help-circle-outline" as const,
      color: Colors.cyan,
    },
    {
      title: i18n.t("exchange"),
      action: () => {
        Linking.openURL("https://nubian-sd.store/exchange-policy");
      },
      icon: "return-up-back" as const,
      color: Colors.lime,
    },
    {
      title: i18n.t("currency") || "Currency",
      subtitle: currentCurrency ? `${currentCurrency.name} (${currentCurrency.symbol})` : currencyCode,
      action: () => {
        setIsCurrencyModalVisible(true);
      },
      icon: "cash-outline" as const,
      color: Colors.primary,
    },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: "",
      headerStyle: { backgroundColor: "transparent" },
    });
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 100 && scrollY.current <= 100) {
      navigation.setOptions({
        headerTitle: i18n.t("profile"),
        headerStyle: {
          backgroundColor: theme.colors.cardBackground,
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTitleStyle: {
          color: theme.colors.text.gray,
          fontSize: 18,
          fontWeight: "600",
        },
      });
    } else if (offsetY <= 100 && scrollY.current > 100) {
      navigation.setOptions({
        headerTitle: "",
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },
      });
    }

    scrollY.current = offsetY;
  };

  useEffect(() => {
    if (loaded && isSignedIn && user) {
      setIsUserLoaded(true);
    } else {
      setIsUserLoaded(false);
    }
  }, [loaded, isSignedIn, user]);

  const { theme, themeMode, setThemeMode, isDark } = useTheme();

  const renderOptionItem = (option: any, index: number) => (
    <TouchableOpacity
      key={index}
      onPress={option.action}
      style={[styles.optionItem, { borderBottomColor: theme.colors.borderLight }]}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${option.color}15` },
          ]}
        >
          <Ionicons name={option.icon} size={20} color={option.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionText, { color: theme.colors.text.gray }]}>{option.title}</Text>
          {option.subtitle && (
            <Text style={[styles.optionSubtitle, { color: theme.colors.text.veryLightGray, fontSize: 12 }]}>
              {option.subtitle}
            </Text>
          )}
        </View>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
        size={20}
        color={theme.colors.gray[300]}
      />
    </TouchableOpacity>
  );

  if (!loaded) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { direction: I18nManager.isRTL ? "rtl" : "ltr" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: headerHeight + 20,
            paddingBottom: tabbarHeight + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* عرض معلومات المستخدم أو دعوة لتسجيل الدخول */}
        {isUserLoaded && user ? (
          /* Profile Header */
          <View style={[styles.profileHeader, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: user?.imageUrl }} style={[styles.avatar, { borderColor: theme.colors.primary }]} />
              <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success, borderColor: theme.colors.background }]} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.welcomeText, { color: theme.colors.text.veryLightGray }]}>{i18n.t("welcome")}</Text>
              <Text style={[styles.userName, { color: theme.colors.text.gray }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.text.veryLightGray }]}>
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
        ) : (
          /* Sign In Invitation */
          <View style={[styles.signInInvitation, { backgroundColor: theme.colors.cardBackground }]}>
            <Image
              source={require("../../assets/images/profilelogin.svg")}
              style={styles.signInImage}
            />
            <View style={styles.signInTextContainer}>
              <Text style={[styles.signInTitle, { color: theme.colors.primary }]}>
                {i18n.t("signInToContinue")}
              </Text>
              <Text style={[styles.signInSubtitle, { color: theme.colors.text.veryLightGray }]}>
                {i18n.t("profile_signInSubtitle")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePresentModalPress}
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>{i18n.t("signIn")}</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* عرض خيارات المستخدم فقط إذا كان مسجل دخول */}
        {isUserLoaded && user && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.gray }]}>{i18n.t("profile")}</Text>
            <View style={[styles.optionsContainer, { backgroundColor: theme.colors.cardBackground }]}>
              {userOnlyOptions.map((option, index) =>
                renderOptionItem(option, index)
              )}
            </View>
          </View>
        )}

        {/* عرض الخيارات العامة دائماً */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.gray }]}>{i18n.t("seeAlso")}</Text>
          <View style={[styles.optionsContainer, { backgroundColor: theme.colors.cardBackground }]}>
            {publicOptions.map((option, index) =>
              renderOptionItem(option, index)
            )}
          </View>
        </View>

        {/* Language Settings Section - متاح دائماً */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.gray }]}>{i18n.t("languageSettings")}</Text>
          <View style={[styles.languageContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.locale === "ar" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => changeLanguage("ar")}
              disabled={i18n.locale === "ar"}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: i18n.locale === "ar" ? theme.colors.text.white : theme.colors.text.veryLightGray },
                ]}
              >
                {i18n.t("profile_arabic")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.locale === "en" && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => changeLanguage("en")}
              disabled={i18n.locale === "en"}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  { color: i18n.locale === "en" ? theme.colors.text.white : theme.colors.text.veryLightGray },
                ]}
              >
                {i18n.t("profile_english")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dark Mode Settings Section - متاح دائماً */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("appearance") || "Appearance"}</Text>
          <View style={[styles.optionsContainer, { backgroundColor: theme.colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.optionItem}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${theme.colors.primary}15` },
                  ]}
                >
                  <Ionicons name="moon-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text.gray }]}>
                  {i18n.t("darkMode") || "Dark Mode"}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(value) => {
                  const newMode = value ? 'dark' : 'light';
                  // Only update if different from current mode (skip if already set)
                  if (themeMode !== newMode) {
                    setThemeMode(newMode);
                  }
                }}
                trackColor={{ false: theme.colors.gray[300], true: theme.colors.primary }}
                thumbColor={theme.colors.background}
                ios_backgroundColor={theme.colors.gray[300]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* عرض زر تسجيل الخروج فقط إذا كان المستخدم مسجل دخول */}
        {isUserLoaded && user && (
          <TouchableOpacity
            onPress={() => signOut()}
            style={[styles.logoutButton, { backgroundColor: theme.colors.cardBackground }]}
            activeOpacity={0.7}
          >
            <View style={styles.logoutContent}>
              <View style={[styles.logoutIconContainer, { backgroundColor: `${theme.colors.error}15` }]}>
                <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
              </View>
              <Text style={[styles.logoutText, { color: theme.colors.error }]}>{i18n.t("logout")}</Text>
            </View>
            <Ionicons
              name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
              size={20}
              color={theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        onChange={handleSheetChanges}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: theme.colors.cardBackground }]}
        handleIndicatorStyle={[styles.bottomSheetIndicator, { backgroundColor: theme.colors.gray[300] }]}
      >
        <BottomSheetView style={styles.contentContainer}>
          <GoogleSignInSheet />
        </BottomSheetView>
      </BottomSheetModal>

      <CurrencySelector
        visible={isCurrencyModalVisible}
        onComplete={() => setIsCurrencyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Sign In Invitation Styles
  signInInvitation: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    marginTop: 24,
  },
  signInImage: {
    width: width * 0.4,
    height: 120,
    marginBottom: 16,
  },
  signInTextContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 28,
  },
  signInSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 160,
  },
  loginButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },

  // Profile Header Styles
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginHorizontal: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 40,
    borderWidth: 3,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: I18nManager.isRTL ? 2 : undefined,
    left: I18nManager.isRTL ? undefined : 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: Colors.text.white,
  },
  userInfo: {
    flex: 1,
    alignItems: I18nManager.isRTL ? "flex-end" : "flex-start",
    lineHeight: 24,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 24,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 48,
  },
  userEmail: {
    fontSize: 15,
    lineHeight: 24,
  },

  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    paddingHorizontal: 4,
    textAlign: "left",
    lineHeight: 34,
  },
  optionsContainer: {
    borderRadius: 16,
  },

  // Option Item Styles
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  optionText: {
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 24,
  },

  // Language Settings Styles
  languageContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },

  // Logout Styles
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "500",
  },

  // Bottom Sheet Styles
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    width: 40,
    borderRadius: 10,
  },
});
