import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  // Plain RN Text (not the themed Text) keeps the CTA label reliably WHITE on
  // the gold fill — see the note below. eslint-disable for this intentional use.
  // eslint-disable-next-line no-restricted-imports
  Text,
  View,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PressableScale } from "@/components/PressableScale";
import { radius } from "@/theme/tokens";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * The app's primary call-to-action. Filled with a deep gold that keeps its
 * WHITE label at ~5:1 contrast in BOTH light and dark themes — the theme
 * `primary` gold is too light for white text (only ~2.4–3.8:1). The lighter rim
 * gives the button a visible raised edge on dark backgrounds.
 *
 * Note: we use React Native's Text (not the app's NativeWind Text) for the
 * label. The themed Text carries a `text-typography-700` class whose color is
 * dark in light mode — that was overriding the inline white and made the label
 * invisible on the gold in light mode. Plain RN Text keeps the label reliably
 * white; the Cairo font is applied manually.
 */
const CTA_GOLD = "#8a6a24";
const CTA_GOLD_RIM = "#b8912f";
const CAIRO_BOLD = Platform.OS === "web" ? undefined : "Cairo-Bold";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        styles.button,
        disabled && !loading ? { opacity: 0.5 } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={20} color="#FFFFFF" style={styles.icon} />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    width: "100%",
    height: 54,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CTA_GOLD,
    borderWidth: 1,
    borderColor: CTA_GOLD_RIM,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginTop: Platform.OS === "android" ? 1 : 0,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    letterSpacing: 0.3,
    fontFamily: CAIRO_BOLD,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
