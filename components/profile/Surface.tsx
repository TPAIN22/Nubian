import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MotiView } from "moti";
import { useTheme } from "@/providers/ThemeProvider";
import { radius } from "@/theme/tokens";

interface SurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The shared card container for the profile screen. Soft shadow in light mode,
 * a subtle hairline border in dark mode — so cards read as elevated surfaces in
 * both themes without any hardcoded colors.
 */
export function Surface({ children, style }: SurfaceProps) {
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.borderLight,
        },
        isDark ? styles.borderDark : styles.shadowLight,
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface FadeInProps extends SurfaceProps {
  /** Stagger offset in ms so sections cascade in as the screen mounts. */
  delay?: number;
}

/** Subtle fade + rise entrance used to stagger the page sections. */
export function FadeIn({ children, style, delay = 0 }: FadeInProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 340, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: "hidden",
  },
  borderDark: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadowLight: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
});
