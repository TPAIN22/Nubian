import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  I18nManager,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import AddToCartButton from "../AddToCartButton";
import i18n from "@/utils/i18n";
import type { SelectedAttributes } from "@/domain/product/product.selectors";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import type { LightColors, DarkColors } from "@/theme";

interface ProductActionsProps {
  product: NormalizedProduct;
  selectedAttributes: SelectedAttributes;
  isAvailable: boolean;
  wishlistLoading: boolean;
  inWishlist: boolean;
  onWishlistPress: () => void;
  themeColors: LightColors | DarkColors;
  onAttempt?: () => void;
}

export const ProductActions = ({
  product,
  selectedAttributes,
  isAvailable,
  wishlistLoading,
  inWishlist,
  onWishlistPress,
  themeColors,
  onAttempt,
}: ProductActionsProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomContainer,
        {
          paddingBottom: Math.max(insets.bottom, 20),
          backgroundColor: themeColors.surface,
          shadowColor: themeColors.text.dark,
        },
      ]}
    >
      <View
        style={[
          styles.actionButtonsRow,
          I18nManager.isRTL && styles.actionButtonsRowRTL,
        ]}
      >
        <View style={styles.addToCartButtonWrapper}>
          <AddToCartButton
            product={product}
            selectedAttributes={selectedAttributes}
            buttonStyle={[
              styles.addToCartButton,
              !isAvailable && styles.disabledButton,
            ]}
            disabled={!isAvailable}
            onPressAttempt={onAttempt}
          />
        </View>

        <Pressable
          style={[
            styles.wishlistButton,
            {
              borderColor: themeColors.borderLight,
              backgroundColor: themeColors.cardBackground,
            },
            wishlistLoading && styles.wishlistButtonDisabled,
          ]}
          onPress={onWishlistPress}
          disabled={wishlistLoading}
          accessibilityLabel={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          accessibilityRole="button"
          accessibilityState={{ disabled: wishlistLoading }}
        >
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={themeColors.text.dark} />
          ) : (
            <Text style={[styles.wishlistButtonText, { color: themeColors.text.gray }]}>
              {i18n.t("wishlist") || "Wishlist"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 16,
  },
  actionButtonsRowRTL: {
    flexDirection: "row-reverse",
  },
  addToCartButtonWrapper: {
    flex: 1,
  },
  addToCartButton: {
    borderRadius: 8,
    paddingVertical: 14,
  },
  disabledButton: {
    opacity: 0.7,
  },
  wishlistButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    minWidth: 110,
  },
  wishlistButtonDisabled: {
    opacity: 0.6,
  },
  wishlistButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
