import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";
import { spacing, typography } from "@/theme/tokens";

/** Subtle staggered fade + rise so the auth screen assembles as it mounts. */
function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: object;
}) {
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

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Rendered pinned near the bottom, below the scrollable content (e.g. terms). */
  footer?: ReactNode;
};

/**
 * Shared shell for the auth screens: safe-area padding, a keyboard-aware scroll
 * view (so inputs are never covered), the brand header (logo + title +
 * subtitle), the form content, and an optional footer.
 */
export function AuthScaffold({ title, subtitle, children, footer }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.colors;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: Math.max(insets.bottom, spacing.base) + spacing.base,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={spacing.xl}
      >
        <FadeIn delay={0}>
          <View style={styles.header}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 420 }}
            >
              <Image
                source={require("../../assets/images/nubianLogo.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </MotiView>
            <Text style={[styles.title, { color: colors.text.gray }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: colors.text.veryLightGray }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </FadeIn>

        <FadeIn delay={110}>{children}</FadeIn>

        {footer ? (
          <FadeIn delay={190} style={styles.footer}>
            {footer}
          </FadeIn>
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    gap: spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.hero,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  footer: {
    marginTop: spacing.xs,
  },
});
