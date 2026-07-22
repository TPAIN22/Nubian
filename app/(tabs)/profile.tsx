import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  I18nManager,
  Linking,
  Switch,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n, { changeLanguage } from "../../utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { useRTL } from "@/hooks/useRTL";
import CurrencySelector from "@/components/CurrencySelector";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useWishlistCount } from "@/store/wishlistStore";
import useAddressStore from "@/store/addressStore";
import useOrderStore from "@/store/orderStore";
import { spacing, typography } from "@/theme/tokens";
import {
  ProfileHeader,
  ProfileStats,
  QuickActions,
  SettingsCard,
  DangerZone,
  SectionTitle,
  SignInCard,
  FadeIn,
  type ProfileRowItem,
  type QuickActionItem,
  type StatItem,
} from "@/components/profile";

export default function Profile() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const tabbarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { textAlign } = useRTL();
  const languageSheetRef = useRef<BottomSheetModal>(null);
  const [isCurrencyModalVisible, setIsCurrencyModalVisible] = useState(false);
  const { currencyCode, currencies } = useCurrencyStore();

  // Live counts pulled from already-populated stores (no new fetches here).
  const wishlistCount = useWishlistCount();
  const addressCount = useAddressStore((s) => s.addresses.length);
  const orderCount = useOrderStore((s: { orders: unknown[] }) => s.orders.length);

  const gold = theme.colors.primary;
  const currentCurrency = currencies.find((c) => c.code === currencyCode);
  const currentLanguageLabel =
    i18n.locale === "ar" ? i18n.t("profile_arabic") : i18n.t("profile_english");

  const initials = useMemo(() => {
    const f = user?.firstName?.[0] ?? "";
    const l = user?.lastName?.[0] ?? "";
    return (f + l).toUpperCase() || "?";
  }, [user?.firstName, user?.lastName]);

  // Optional role badge — only shown when Clerk metadata provides one.
  const roleBadge = useMemo(() => {
    const role = (user?.publicMetadata?.role ?? user?.unsafeMetadata?.role) as
      | string
      | undefined;
    if (!role || typeof role !== "string") return undefined;
    const normalized = role.toLowerCase();
    if (normalized === "merchant" || normalized === "admin") {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return undefined;
  }, [user?.publicMetadata?.role, user?.unsafeMetadata?.role]);

  const handlePresentSignIn = useCallback(() => {
    router.push("/signin");
  }, [router]);

  // With useUser(), `user` is guaranteed present when isSignedIn is true.
  const isUserLoaded = Boolean(isLoaded && isSignedIn && user);

  const stats: StatItem[] = useMemo(
    () => [
      {
        key: "orders",
        label: i18n.t("orders"),
        value: orderCount,
        icon: "receipt-outline",
        onPress: () => router.push("/order"),
      },
      {
        key: "wishlist",
        label: i18n.t("wishlistTitle"),
        value: wishlistCount,
        icon: "heart-outline",
        onPress: () => router.push("/(tabs)/wishlist"),
      },
      {
        key: "addresses",
        label: i18n.t("address"),
        value: addressCount,
        icon: "location-outline",
        onPress: () => router.push("/addresses"),
      },
    ],
    [orderCount, wishlistCount, addressCount, router]
  );

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      {
        key: "orders",
        title: i18n.t("orders"),
        icon: "receipt-outline",
        onPress: () => router.push("/order"),
      },
      {
        key: "wishlist",
        title: i18n.t("wishlistTitle"),
        icon: "heart-outline",
        onPress: () => router.push("/(tabs)/wishlist"),
      },
      {
        key: "addresses",
        title: i18n.t("address"),
        icon: "location-outline",
        onPress: () => router.push("/addresses"),
      },
      {
        key: "notifications",
        title: i18n.t("notifications"),
        icon: "notifications-outline",
        onPress: () => router.push("/notification"),
      },
    ],
    [router]
  );

  const preferenceItems: ProfileRowItem[] = useMemo(
    () => [
      {
        key: "language",
        title: i18n.t("language"),
        icon: "language-outline",
        onPress: () => languageSheetRef.current?.present(),
        trailingText: currentLanguageLabel,
      },
      {
        key: "currency",
        title: i18n.t("currency"),
        icon: "cash-outline",
        onPress: () => setIsCurrencyModalVisible(true),
        trailingText: currentCurrency
          ? `${currentCurrency.code} (${currentCurrency.symbol})`
          : currencyCode ?? undefined,
      },
      {
        key: "darkMode",
        title: i18n.t("darkMode"),
        icon: "moon-outline",
        rightSlot: (
          <Switch
            value={isDark}
            onValueChange={(value) => {
              const newMode = value ? "dark" : "light";
              if (themeMode !== newMode) setThemeMode(newMode);
            }}
            trackColor={{ false: theme.colors.gray[300], true: gold }}
            thumbColor={theme.colors.background}
            ios_backgroundColor={theme.colors.gray[300]}
          />
        ),
      },
    ],
    [
      currentLanguageLabel,
      currentCurrency,
      currencyCode,
      isDark,
      themeMode,
      setThemeMode,
      theme.colors.gray,
      theme.colors.background,
      gold,
    ]
  );

  const helpItems: ProfileRowItem[] = useMemo(
    () => [
      {
        key: "support",
        title: i18n.t("support"),
        icon: "help-circle-outline",
        onPress: () => router.push("/(screens)/support"),
      },
      {
        key: "privacy",
        title: i18n.t("privacyPolicy"),
        icon: "shield-outline",
        onPress: () => Linking.openURL("https://nubian-sd.com/privacy-policy"),
      },
      {
        key: "exchange",
        title: i18n.t("exchange"),
        icon: "return-up-back",
        onPress: () => Linking.openURL("https://nubian-sd.com/exchange-policy"),
      },
    ],
    [router]
  );

  const logoutItems: ProfileRowItem[] = useMemo(
    () => [
      {
        key: "logout",
        title: i18n.t("logout"),
        icon: "log-out-outline",
        onPress: () => signOut(),
      },
    ],
    [signOut]
  );

  if (!isLoaded) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            direction: I18nManager.isRTL ? "rtl" : "ltr",
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <ActivityIndicator size="large" color={gold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: tabbarHeight + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: theme.colors.text.gray, textAlign }]}>
          {i18n.t("profile")}
        </Text>

        {/* ── Header / identity ─────────────────────────────────── */}
        {isUserLoaded ? (
          <FadeIn delay={0}>
            <ProfileHeader
              name={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
              email={user?.primaryEmailAddress?.emailAddress}
              imageUrl={user?.imageUrl}
              initials={initials}
              badge={roleBadge}
              editLabel={i18n.t("editProfile")}
              onPress={() => router.push("/editProfile")}
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0}>
            <SignInCard
              title={i18n.t("signInToContinue")}
              subtitle={i18n.t("profile_signInSubtitle")}
              buttonLabel={i18n.t("signIn")}
              onPress={handlePresentSignIn}
            />
          </FadeIn>
        )}

        {/* ── Stats ─────────────────────────────────────────────── */}
        {isUserLoaded && (
          <FadeIn delay={70}>
            <ProfileStats stats={stats} />
          </FadeIn>
        )}

        {/* ── Quick actions ─────────────────────────────────────── */}
        {isUserLoaded && (
          <FadeIn delay={130}>
            <View style={styles.section}>
              <QuickActions actions={quickActions} />
            </View>
          </FadeIn>
        )}

        {/* ── Preferences ───────────────────────────────────────── */}
        <FadeIn delay={190}>
          <View style={styles.section}>
            <SectionTitle>{i18n.t("preferences")}</SectionTitle>
            <SettingsCard items={preferenceItems} />
          </View>
        </FadeIn>

        {/* ── Support & Legal ───────────────────────────────────── */}
        <FadeIn delay={250}>
          <View style={styles.section}>
            <SectionTitle>{i18n.t("helpAndLegal")}</SectionTitle>
            <SettingsCard items={helpItems} />
          </View>
        </FadeIn>

        {/* ── Danger zone ───────────────────────────────────────── */}
        {isUserLoaded && (
          <FadeIn delay={310}>
            <View style={styles.section}>
              <DangerZone items={logoutItems} />
            </View>
          </FadeIn>
        )}
      </ScrollView>

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
          <Text style={[styles.sheetTitle, { color: theme.colors.text.gray }]}>
            {i18n.t("languageSettings")}
          </Text>
          {(["ar", "en"] as const).map((code, i, arr) => {
            const active = i18n.locale === code;
            const label =
              code === "ar"
                ? i18n.t("profile_arabic")
                : i18n.t("profile_english");
            return (
              <Pressable
                key={code}
                onPress={() => {
                  if (!active) changeLanguage(code);
                  languageSheetRef.current?.dismiss();
                }}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.sheetRow,
                  i !== arr.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sheetRowLabel,
                    {
                      color: active ? gold : theme.colors.text.gray,
                      fontWeight: active ? "600" : "400",
                    },
                  ]}
                >
                  {label}
                </Text>
                {active && <Ionicons name="checkmark" size={20} color={gold} />}
              </Pressable>
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: spacing.lg },

  screenTitle: {
    ...typography.hero,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },

  section: { marginBottom: spacing.xl },

  // Language bottom sheet
  sheetBackground: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetIndicator: { width: 40, borderRadius: 10 },
  languageSheet: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sheetTitle: {
    ...typography.label,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  sheetRowLabel: {
    ...typography.body,
    flex: 1,
  },
});
