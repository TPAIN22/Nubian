import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  I18nManager,
  Linking,
  Switch,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useNavigation, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type Row = {
  title: string;
  icon: IoniconName;
  onPress: () => void;
  trailing?: string;
};

export default function Profile() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const tabbarHeight = useBottomTabBarHeight();
  const { loaded, isSignedIn } = useClerk();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const navigation = useNavigation();
  const scrollY = useRef(0);
  const signInSheetRef = useRef<BottomSheetModal>(null);
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const { currencyCode, currencies } = useCurrencyStore();

  const currentCurrency = currencies.find((c) => c.code === currencyCode);
  const currentLanguageLabel =
    i18n.locale === "ar" ? i18n.t("profile_arabic") : i18n.t("profile_english");

  const initials = useMemo(() => {
    const f = user?.firstName?.[0] ?? "";
    const l = user?.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || "?";
  }, [user?.firstName, user?.lastName]);

  const handlePresentSignIn = useCallback(() => {
    router.push("/signin");
  }, [router]);

  const handleSheetChanges = useCallback(() => {}, []);

  const accountRows: Row[] = [
    {
      title: i18n.t("editProfile"),
      icon: "person-outline",
      onPress: () => router.push("/editProfile"),
    },
    {
      title: i18n.t("notifications"),
      icon: "notifications-outline",
      onPress: () => router.push("/notification"),
    },
    {
      title: i18n.t("orders"),
      icon: "receipt-outline",
      onPress: () => router.push("/order"),
    },
    {
      title: i18n.t("shippingAddresses"),
      icon: "location-outline",
      onPress: () => router.push("/addresses"),
    },
  ];

  const helpRows: Row[] = [
    {
      title: i18n.t("support"),
      icon: "help-circle-outline",
      onPress: () => router.push("/(screens)/support"),
    },
    {
      title: i18n.t("privacyPolicy"),
      icon: "shield-outline",
      onPress: () => Linking.openURL("https://nubian-sd.com/privacy-policy"),
    },
    {
      title: i18n.t("exchange"),
      icon: "return-up-back",
      onPress: () => Linking.openURL("https://nubian-sd.com/exchange-policy"),
    },
    {
      title: i18n.t("security"),
      icon: "lock-closed-outline",
      onPress: () => {},
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
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.colors.text.gray,
          fontSize: 17,
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
    setIsUserLoaded(Boolean(loaded && isSignedIn && user));
  }, [loaded, isSignedIn, user]);

  const renderRow = (
    {
      title,
      icon,
      onPress,
      trailing,
      isLast,
      tone = "default",
      rightSlot,
    }: {
      title: string;
      icon: IoniconName;
      onPress?: () => void;
      trailing?: string;
      isLast: boolean;
      tone?: "default" | "danger";
      rightSlot?: React.ReactNode;
    },
    key: string | number
  ) => {
    const titleColor =
      tone === "danger" ? theme.colors.error : theme.colors.text.gray;
    const iconColor =
      tone === "danger" ? theme.colors.error : theme.colors.text.mediumGray;
    const chevronColor =
      tone === "danger" ? theme.colors.error : theme.colors.text.veryLightGray;

    return (
      <TouchableOpacity
        key={key}
        onPress={onPress}
        activeOpacity={0.6}
        style={[
          styles.row,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <Ionicons name={icon} size={22} color={iconColor} />
          <Text style={[styles.rowTitle, { color: titleColor }]}>{title}</Text>
        </View>
        <View style={styles.rowRight}>
          {trailing ? (
            <Text
              style={[
                styles.rowTrailing,
                { color: theme.colors.text.veryLightGray },
              ]}
            >
              {trailing}
            </Text>
          ) : null}
          {rightSlot ? (
            rightSlot
          ) : onPress ? (
            <Ionicons
              name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
              size={18}
              color={chevronColor}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (!loaded) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            direction: I18nManager.isRTL ? "rtl" : "ltr",
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: headerHeight + 16,
            paddingBottom: tabbarHeight + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isUserLoaded && user ? (
          <View
            style={[
              styles.profileHeader,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarFallback,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: theme.colors.text.gray },
                  ]}
                >
                  {initials}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text
                style={[
                  styles.userName,
                  { color: theme.colors.text.gray },
                ]}
              >
                {user?.firstName} {user?.lastName}
              </Text>
              <Text
                style={[
                  styles.userEmail,
                  { color: theme.colors.text.veryLightGray },
                ]}
              >
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.signInBlock,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            <Text
              style={[
                styles.signInLabel,
                { color: theme.colors.text.veryLightGray },
              ]}
            >
              {i18n.t("welcome")}
            </Text>
            <Text
              style={[styles.signInTitle, { color: theme.colors.text.gray }]}
            >
              {i18n.t("signInToContinue")}
            </Text>
            <Text
              style={[
                styles.signInSubtitle,
                { color: theme.colors.text.veryLightGray },
              ]}
            >
              {i18n.t("profile_signInSubtitle")}
            </Text>
            <TouchableOpacity
              onPress={handlePresentSignIn}
              style={[
                styles.signInButton,
                { backgroundColor: theme.colors.primary },
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>{i18n.t("signIn")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {isUserLoaded && user && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.veryLightGray },
              ]}
            >
              {(i18n.t("account") as string) || i18n.t("profile")}
            </Text>
            <View
              style={[
                styles.group,
                { backgroundColor: theme.colors.cardBackground },
              ]}
            >
              {accountRows.map((row, i) =>
                renderRow(
                  {
                    title: row.title,
                    icon: row.icon,
                    onPress: row.onPress,
                    isLast: i === accountRows.length - 1,
                  },
                  i
                )
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text.veryLightGray },
            ]}
          >
            {(i18n.t("preferences") as string) || i18n.t("languageSettings")}
          </Text>
          <View
            style={[
              styles.group,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            {renderRow(
              {
                title: i18n.t("language") || "Language",
                icon: "language-outline",
                onPress: () => languageSheetRef.current?.present(),
                trailing: currentLanguageLabel,
                isLast: false,
              },
              "lang"
            )}
            {renderRow(
              {
                title: i18n.t("currency") || "Currency",
                icon: "cash-outline",
                onPress: () => setIsCurrencyModalVisible(true),
                trailing: currentCurrency
                  ? `${currentCurrency.code} (${currentCurrency.symbol})`
                  : currencyCode,
                isLast: false,
              },
              "currency"
            )}
            {renderRow(
              {
                title: i18n.t("darkMode") || "Dark Mode",
                icon: "moon-outline",
                isLast: true,
                rightSlot: (
                  <Switch
                    value={isDark}
                    onValueChange={(value) => {
                      const newMode = value ? "dark" : "light";
                      if (themeMode !== newMode) {
                        setThemeMode(newMode);
                      }
                    }}
                    trackColor={{
                      false: theme.colors.gray[300],
                      true: theme.colors.primary,
                    }}
                    thumbColor={theme.colors.background}
                    ios_backgroundColor={theme.colors.gray[300]}
                  />
                ),
              },
              "dark"
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text.veryLightGray },
            ]}
          >
            {(i18n.t("helpAndLegal") as string) || i18n.t("seeAlso")}
          </Text>
          <View
            style={[
              styles.group,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            {helpRows.map((row, i) =>
              renderRow(
                {
                  title: row.title,
                  icon: row.icon,
                  onPress: row.onPress,
                  isLast: i === helpRows.length - 1,
                },
                i
              )
            )}
          </View>
        </View>

        {isUserLoaded && user && (
          <View style={styles.section}>
            <View
              style={[
                styles.group,
                { backgroundColor: theme.colors.cardBackground },
              ]}
            >
              {renderRow(
                {
                  title: i18n.t("logout"),
                  icon: "log-out-outline",
                  onPress: () => signOut(),
                  isLast: true,
                  tone: "danger",
                },
                "logout"
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <BottomSheetModal
        ref={signInSheetRef}
        onChange={handleSheetChanges}
        backgroundStyle={[
          styles.sheetBackground,
          { backgroundColor: theme.colors.cardBackground },
        ]}
        handleIndicatorStyle={[
          styles.sheetIndicator,
          { backgroundColor: theme.colors.gray[300] },
        ]}
      >
        <BottomSheetView style={styles.sheetContent}>
          <GoogleSignInSheet />
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={languageSheetRef}
        snapPoints={["28%"]}
        backgroundStyle={[
          styles.sheetBackground,
          { backgroundColor: theme.colors.cardBackground },
        ]}
        handleIndicatorStyle={[
          styles.sheetIndicator,
          { backgroundColor: theme.colors.gray[300] },
        ]}
      >
        <BottomSheetView style={styles.languageSheet}>
          <Text
            style={[
              styles.sheetTitle,
              { color: theme.colors.text.gray },
            ]}
          >
            {i18n.t("languageSettings")}
          </Text>
          {(["ar", "en"] as const).map((code, i, arr) => {
            const active = i18n.locale === code;
            const label =
              code === "ar"
                ? i18n.t("profile_arabic")
                : i18n.t("profile_english");
            return (
              <TouchableOpacity
                key={code}
                onPress={() => {
                  if (!active) changeLanguage(code);
                  languageSheetRef.current?.dismiss();
                }}
                activeOpacity={0.6}
                style={[
                  styles.row,
                  i !== arr.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rowTitle,
                    {
                      color: active
                        ? theme.colors.primary
                        : theme.colors.text.gray,
                      fontWeight: active ? "600" : "400",
                    },
                  ]}
                >
                  {label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
  },

  // Profile header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "600",
  },
  userInfo: {
    flex: 1,
    alignItems: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
  },

  // Sign-in block
  signInBlock: {
    padding: 24,
    borderRadius: 14,
    marginBottom: 24,
    alignItems: I18nManager.isRTL ? "flex-end" : "flex-start",
  },
  signInLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  signInTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  signInSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  signInButton: {
    alignSelf: "stretch",
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: "600",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 14,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "400",
  },
  rowTrailing: {
    fontSize: 14,
  },

  // Sheets
  sheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetIndicator: {
    width: 40,
    borderRadius: 10,
  },
  sheetContent: {
    paddingHorizontal: 20,
  },
  languageSheet: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
