import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { memo } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useRTL } from '@/hooks/useRTL';
import { elevation, iconSize, SCREEN_PADDING, spacing } from '@/theme/tokens';
import i18n from '@/utils/i18n';

interface ProductHeaderProps {
  inWishlist: boolean;
  wishlistLoading: boolean;
  onWishlistPress: () => void;
}

const OverlayButton = ({
  onPress,
  children,
  disabled,
  cardBg,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  cardBg: string;
  accessibilityLabel: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
    style={styles.buttonOuter}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled: !!disabled }}
  >
    {Platform.OS === 'ios' ? (
      <BlurView intensity={60} tint="systemChromeMaterial" style={styles.buttonInner}>
        {children}
      </BlurView>
    ) : (
      <View style={[styles.buttonInner, { backgroundColor: cardBg }]}>{children}</View>
    )}
  </TouchableOpacity>
);

export const ProductHeader = memo(
  ({ inWishlist, wishlistLoading, onWishlistPress }: ProductHeaderProps) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = theme.colors;
    const rtl = useRTL();

    return (
      <View
        style={[styles.container, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <OverlayButton
          onPress={() => router.back()}
          cardBg={colors.cardBackground + 'E0'}
          accessibilityLabel={i18n.t('back') || 'Back'}
        >
          <Ionicons name={rtl.chevronBack} size={iconSize.md} color={colors.text.title} />
        </OverlayButton>

        <OverlayButton
          onPress={onWishlistPress}
          disabled={wishlistLoading}
          cardBg={colors.cardBackground + 'E0'}
          accessibilityLabel={
            inWishlist
              ? i18n.t('removeFromWishlist') || 'Remove from wishlist'
              : i18n.t('addToWishlist') || 'Add to wishlist'
          }
        >
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={colors.text.title} />
          ) : (
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={iconSize.md}
              // `sale` rather than `danger`: saving something is a positive
              // action, and the error red made a favourite look like a warning.
              color={inWishlist ? colors.sale : colors.text.title}
            />
          )}
        </OverlayButton>
      </View>
    );
  }
);
ProductHeader.displayName = 'ProductHeader';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.sm,
  },
  buttonOuter: {
    // 42pt visual + 8pt hitSlop clears the 44pt target comfortably while
    // staying small enough not to cover the product photo.
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    ...elevation.md,
  },
  buttonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
