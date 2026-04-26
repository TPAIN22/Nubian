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
}: {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  cardBg: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
    style={styles.buttonOuter}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

    return (
      <View
        style={[styles.container, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <OverlayButton onPress={() => router.back()} cardBg={colors.cardBackground + 'E0'}>
          <Ionicons name="chevron-back" size={20} color={colors.text.gray} />
        </OverlayButton>

        <OverlayButton
          onPress={onWishlistPress}
          disabled={wishlistLoading}
          cardBg={colors.cardBackground + 'E0'}
        >
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={colors.text.gray} />
          ) : (
            <Ionicons
              name={inWishlist ? 'heart' : 'heart-outline'}
              size={20}
              color={inWishlist ? colors.danger : colors.text.gray}
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  buttonOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    }),
  },
  buttonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
