import { useMemo, useRef, useCallback } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Animated,
  I18nManager,
} from "react-native";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { useCurrencyStore } from "@/store/useCurrencyStore";

interface CheckoutProps {
  total: number;
  handleCheckout: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  currency?: string;
}

export default function Checkout({
  total,
  handleCheckout,
  isLoading = false,
  disabled = false,
  currency: propCurrency,
}: CheckoutProps) {
  const { width } = useWindowDimensions();
  const activeCurrencyCode = useCurrencyStore(state => state.currencyCode);
  // Prefer the explicit `currency` prop (the currency the `total` was computed
  // in — e.g. cart.currencyCode). Only fall back to the active store currency
  // when the caller hasn't told us; if neither is set, render no symbol rather
  // than a bogus hardcoded one.
  const currency = propCurrency || activeCurrencyCode || "";
  const { theme } = useTheme();
  const colors = theme.colors;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || isLoading;

  const bgColor = useMemo(() => {
    if (isDisabled) return colors.gray?.[400] ?? "#9CA3AF";
    return colors.text.black; // نفس ستايلك
  }, [isDisabled, colors]);

  const pressIn = useCallback(() => {
    if (isDisabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 180,
        friction: 9,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDisabled, scaleAnim, opacityAnim]);

  const pressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 180,
        friction: 9,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const onPress = useCallback(() => {
    if (isDisabled) return;
    handleCheckout();
  }, [isDisabled, handleCheckout]);

  // Resolve the currency object for the currency the total is denominated in,
  // not the user's active currency — those can diverge during currency switches.
  const currencies = useCurrencyStore(state => state.currencies);
  const resolvedCurrency = useMemo(
    () => currencies.find((c) => c.code === currency) ?? null,
    [currencies, currency]
  );
  const displaySymbol = resolvedCurrency?.symbol || currency || "";

  const formattedTotal = useMemo(() => {
    const decimals = resolvedCurrency?.decimals ?? 2;
    return total.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [total, resolvedCurrency]);

  return (
    <View style={[styles.container, { width }]}>
      <Animated.View
        style={[
          styles.buttonContainer,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Pressable
          style={[
            styles.button,
            { backgroundColor: bgColor },
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={isDisabled}
          android_ripple={{
            color: `${colors.text.white}26`,
            borderless: false,
          }}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("checkout") || "Checkout"}
          accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        >
          <View style={[styles.buttonContent, I18nManager.isRTL && styles.buttonContentRTL]}>
            <View style={styles.checkoutSection}>
              <Text style={[styles.text, { color: colors.text.white }]}>
                {isLoading ? i18n.t("processing") || "Processing..." : i18n.t("checkout") || "Checkout"}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: `${colors.text.white}4D` }]} />

            <View style={styles.amountSection}>
              <Text style={[styles.currencyLabel, { color: `${colors.text.white}CC` }]}>
                {displaySymbol}
              </Text>
              <Text style={[styles.textAmount, { color: colors.text.white }]} numberOfLines={1}>
                {formattedTotal}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingVertical: 2,
    paddingHorizontal: 16,
  },

  buttonContainer: {
    width: "100%",
  },

  button: {
    borderRadius: 8,
    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.85,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    minHeight: 60,
  },

  buttonContentRTL: {
    flexDirection: "row-reverse",
  },

  checkoutSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    lineHeight: 34,
  },

  divider: {
    width: 2,
    height: 40,
    marginHorizontal: 16,
  },

  amountSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 6,
  },

  currencyLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },

  textAmount: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
});
