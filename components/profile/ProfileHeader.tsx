import {
  StyleSheet,
  View,
  Platform,
  // Plain RN Text ONLY for the badge/edit labels that sit on a colored fill: the
  // themed <Text> forces a `text-typography-700` class that overrides inline
  // color and would hide them on the gold surface.
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { useRTL } from "@/hooks/useRTL";
import { radius, spacing, typography } from "@/theme/tokens";
import { ProfileAvatar } from "./ProfileAvatar";
import { PressableScale } from "./PressableScale";

// Near-black label color for text/icons on the gold fill (see note above).
const ON_GOLD = "#1c1a12";

interface ProfileHeaderProps {
  name: string;
  email?: string;
  imageUrl?: string | null;
  initials: string;
  /** Optional role badge (e.g. Merchant / Admin) — hidden when undefined. */
  badge?: string;
  editLabel: string;
  onPress: () => void;
}

/** The identity block: avatar, name, email, optional role badge and edit CTA. */
export function ProfileHeader({
  name,
  email,
  imageUrl,
  initials,
  badge,
  editLabel,
  onPress,
}: ProfileHeaderProps) {
  const { theme } = useTheme();
  const { rowDirection, textAlign, chevronForward } = useRTL();
  const gold = theme.colors.primary;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={editLabel}
      style={[styles.container, { flexDirection: rowDirection }]}
    >
      <ProfileAvatar imageUrl={imageUrl} initials={initials} size={68} />

      <View style={[styles.info, { alignItems: textAlign === "right" ? "flex-end" : "flex-start" }]}>
        <View style={[styles.nameRow, { flexDirection: rowDirection }]}>
          <Text
            style={[styles.name, { color: theme.colors.text.gray, textAlign }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: gold }]}>
              <RNText style={styles.badgeText}>{badge}</RNText>
            </View>
          ) : null}
        </View>
        {email ? (
          <Text
            style={[styles.email, { color: theme.colors.text.veryLightGray, textAlign }]}
            numberOfLines={1}
          >
            {email}
          </Text>
        ) : null}

        <View style={[styles.editRow, { flexDirection: rowDirection }]}>
          <RNText style={[styles.editText, { color: gold }]}>{editLabel}</RNText>
          <Ionicons name={chevronForward} size={14} color={gold} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.base,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    ...typography.title,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    color: ON_GOLD,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontFamily: Platform.OS === "web" ? undefined : "Cairo-Bold",
  },
  email: {
    ...typography.caption,
    fontSize: 14,
  },
  editRow: {
    alignItems: "center",
    gap: 3,
    marginTop: spacing.sm,
  },
  editText: {
    ...typography.captionStrong,
  },
});
