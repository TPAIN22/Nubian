import { Text, StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { formatMoney, type Money as MoneyT } from "@/utils/priceUtils";

type Variant = "primary" | "strike" | "small";

interface MoneyProps {
  value: MoneyT | number | null | undefined;
  variant?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * Single source of price rendering. Reads `formatted` straight from a Money
 * envelope when present (canonical backend output), otherwise formats a raw
 * amount using the currently-selected currency. Never performs FX conversion.
 */
export function Money({ value, variant = "primary", color, style, numberOfLines }: MoneyProps) {
  const text = formatMoney(value);
  if (!text) return null;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles[variant], color ? { color } : null, style]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  primary: { fontWeight: "700", fontSize: 14 },
  strike:  { fontSize: 11, textDecorationLine: "line-through", opacity: 0.6, fontWeight: "400" },
  small:   { fontSize: 12, opacity: 0.8 },
});

export default Money;
