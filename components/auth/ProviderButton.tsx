import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { PressableScale } from "@/components/PressableScale";
import { radius } from "@/theme/tokens";

/**
 * OAuth / provider button (Google, Facebook, Apple, email…). Presentational
 * only — colors are passed in so the same component serves light and dark
 * providers. Shared by welcome, signin and signup.
 */
type Props = {
  onPress: () => void;
  label: string;
  icon: React.ReactNode;
  background: string;
  borderColor: string;
  textColor: string;
  loading?: boolean;
  disabled?: boolean;
};

export function ProviderButton({
  onPress,
  label,
  icon,
  background,
  borderColor,
  textColor,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      style={[
        styles.button,
        { backgroundColor: background, borderColor },
        disabled && !loading ? { opacity: 0.6 } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <View style={styles.iconWrap}>{icon}</View>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
