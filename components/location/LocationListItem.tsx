import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import {
  PressableScale,
  spacing,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";

interface Props {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  selected: boolean;
  isRTL: boolean;
  onPress: (id: string) => void;
}

/**
 * A single selectable row (country / city / area). Leading tinted glyph, label,
 * and a trailing checkmark when selected (chevron otherwise). Scales softly on
 * press via the shared PressableScale primitive.
 *
 * Memoized with a custom comparator so typing in the search box only re-renders
 * rows whose selected state actually changed.
 */
export const LocationListItem = React.memo(
  function LocationListItem({ id, label, icon, selected, isRTL, onPress }: Props) {
    const t = useCheckoutTheme();
    const handlePress = useCallback(() => onPress(id), [id, onPress]);

    return (
      <PressableScale
        scaleTo={0.98}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={[
          styles.item,
          {
            backgroundColor: selected ? t.accentSoft : t.card,
            borderColor: selected ? t.accent : t.border,
          },
        ]}
      >
        <View
          style={[
            styles.icon,
            { backgroundColor: selected ? t.accent : t.accentSoft },
          ]}
        >
          <Ionicons
            name={icon}
            size={17}
            color={selected ? t.textInverse : t.accent}
          />
        </View>

        <Text
          style={[
            styles.label,
            {
              color: selected ? t.accent : t.textPrimary,
              fontWeight: selected ? "700" : "500",
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {selected ? (
          <Ionicons name="checkmark-circle" size={20} color={t.accent} />
        ) : (
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={16}
            color={t.textTertiary}
          />
        )}
      </PressableScale>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.label === next.label &&
    prev.selected === next.selected &&
    prev.icon === next.icon &&
    prev.isRTL === next.isRTL &&
    prev.onPress === next.onPress,
);

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    marginBottom: spacing.sm,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...typography.body, flex: 1, fontSize: 15 },
});
