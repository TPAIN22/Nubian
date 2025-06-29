import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  I18nManager,
} from "react-native";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useNavigation, useRouter } from "expo-router";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { Button } from "react-native";
import GoogleSignInSheet from "@/app/(auth)/signin";
import i18n, { changeLanguage } from "../../utils/i18n";

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

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback((index: number) => {}, []);

  // العناصر التي تحتاج تسجيل دخول
  const userOnlyOptions = [
    {
      title: i18n.t("editProfile"),
      action: () => {
        router.push("/editProfile");
      },
      icon: "person-outline" as const,
      color: "#4A90E2",
    },
    {
      title: i18n.t("notifications"),
      action: () => {
        router.push("/notification");
      },
      icon: "notifications-outline" as const,
      color: "#F5A623",
    },
    {
      title: i18n.t("orders"),
      action: () => {
        router.push("/order");
      },
      icon: "receipt-outline" as const,
      color: "#7ED321",
    },
  ];

  // العناصر المتاحة للجميع (بدون تسجيل دخول)
  const publicOptions = [
    {
      title: i18n.t("privacyPolicy"),
      action: () => {
        // يمكن إضافة الوظيفة هنا
      },
      icon: "shield-outline" as const,
      color: "#9013FE",
    },
    {
      title: i18n.t("security"),
      action: () => {
        // يمكن إضافة الوظيفة هنا
      },
      icon: "lock-closed-outline" as const,
      color: "#FF6B35",
    },
    {
      title: i18n.t("support"),
      action: () => {
        // يمكن إضافة الوظيفة هنا
      },
      icon: "help-circle-outline" as const,
      color: "#50E3C2",
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
          backgroundColor: "#FFFFFF",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerTitleStyle: {
          color: "#333333",
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

  const renderOptionItem = (option: any, index: number) => (
    <TouchableOpacity
      key={index}
      onPress={option.action}
      style={styles.optionItem}
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
        <Text style={styles.optionText}>{option.title}</Text>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
        size={20}
        color="#C7C7CC"
      />
    </TouchableOpacity>
  );

  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e98c22" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.container}
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
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>{i18n.t("welcome")}</Text>
                <Text style={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.userEmail}>
                  {user?.primaryEmailAddress?.emailAddress}
                </Text>
              </View>
            </View>
          ) : (
            /* Sign In Invitation */
            <View style={styles.signInInvitation}>
              <Image
                source={require("../../assets/images/profilelogin.svg")}
                style={styles.signInImage}
              />
              <View style={styles.signInTextContainer}>
                <Text style={styles.signInTitle}>
                  {i18n.t("signInToContinue")}
                </Text>
                <Text style={styles.signInSubtitle}>
                  قم بتسجيل الدخول للوصول إلى ملفك الشخصي والإعدادات
                </Text>
              </View>
              <TouchableOpacity
                onPress={handlePresentModalPress}
                style={styles.loginButton}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>{i18n.t("signIn")}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* عرض خيارات المستخدم فقط إذا كان مسجل دخول */}
          {isUserLoaded && user && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t("profile")}</Text>
              <View style={styles.optionsContainer}>
                {userOnlyOptions.map((option, index) =>
                  renderOptionItem(option, index)
                )}
              </View>
            </View>
          )}

          {/* عرض الخيارات العامة دائماً */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t("seeAlso")}</Text>
            <View style={styles.optionsContainer}>
              {publicOptions.map((option, index) =>
                renderOptionItem(option, index)
              )}
            </View>
          </View>

          {/* Language Settings Section - متاح دائماً */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t("languageSettings")}</Text>
            <View style={styles.languageContainer}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  i18n.locale === "ar" && styles.languageButtonActive,
                ]}
                onPress={() => changeLanguage("ar")}
                disabled={i18n.locale === "ar"}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    i18n.locale === "ar" && styles.languageButtonTextActive,
                  ]}
                >
                  العربية
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  i18n.locale === "en" && styles.languageButtonActive,
                ]}
                onPress={() => changeLanguage("en")}
                disabled={i18n.locale === "en"}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    i18n.locale === "en" && styles.languageButtonTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* عرض زر تسجيل الخروج فقط إذا كان المستخدم مسجل دخول */}
          {isUserLoaded && user && (
            <TouchableOpacity
              onPress={() => signOut()}
              style={styles.logoutButton}
              activeOpacity={0.7}
            >
              <View style={styles.logoutContent}>
                <View style={styles.logoutIconContainer}>
                  <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                </View>
                <Text style={styles.logoutText}>{i18n.t("logout")}</Text>
              </View>
              <Ionicons
                name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
                size={20}
                color="#FF3B30"
              />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Bottom Sheet Modal */}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          backgroundStyle={styles.bottomSheetBackground}
          handleIndicatorStyle={styles.bottomSheetIndicator}
        >
          <BottomSheetView style={styles.contentContainer}>
            <GoogleSignInSheet />
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Sign In Invitation Styles
  signInInvitation: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    color: "#e98c22",
    marginBottom: 8,
    textAlign: "center",
  },
  signInSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e98c22",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 160,
    shadowColor: "#e98c22",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
  },

  // Profile Header Styles
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
    marginHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#e98c22",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: I18nManager.isRTL ? 2 : undefined,
    left: I18nManager.isRTL ? undefined : 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#34C759",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    alignItems: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  welcomeText: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: "#8E8E93",
  },

  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
    paddingHorizontal: 4,
    textAlign: "left",
  },
  optionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Option Item Styles
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
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
    color: "#1C1C1E",
    fontWeight: "400",
  },

  // Language Settings Styles
  languageContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  languageButtonActive: {
    backgroundColor: "#e98c22",
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8E8E93",
  },
  languageButtonTextActive: {
    color: "#FFFFFF",
  },

  // Logout Styles
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#FF3B3015",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
  },
  logoutText: {
    fontSize: 17,
    color: "#FF3B30",
    fontWeight: "500",
  },

  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: "#C7C7CC",
    width: 40,
    borderRadius: 10,
  },
});