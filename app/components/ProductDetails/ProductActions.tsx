import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import AddToCartButton from "../AddToCartButton";
import i18n from "@/utils/i18n";
import type { Product, SelectedAttributes } from "@/types/cart.types";
import type { LightColors, DarkColors } from "@/theme";

interface ProductActionsProps {
  product: Product;
  selectedSize?: string | null;
  selectedAttributes: SelectedAttributes;
  isAvailable: boolean;
  wishlistLoading: boolean;
  inWishlist: boolean;
  onWishlistPress: () => void;
  themeColors: LightColors | DarkColors;
}

export const ProductActions = ({
  product,
  selectedSize,
  selectedAttributes,
  isAvailable,
  wishlistLoading,
  inWishlist,
  onWishlistPress,
  themeColors,
}: ProductActionsProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomContainer,
        {
          paddingBottom: Math.max(insets.bottom, 20),
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.borderLight,
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
            selectedSize={selectedSize ?? ""} // ممكن تخليها زي ما هي للباكورد
            selectedAttributes={selectedAttributes} // ✅ دا الأساس
            buttonStyle={[
              styles.addToCartButton,
              !isAvailable && styles.disabledButton,
            ]}
            disabled={!isAvailable}
          />
        </View>
        <Pressable
          style={[
            styles.wishlistButton,
            wishlistLoading && styles.wishlistButtonDisabled,
          ]}
          onPress={onWishlistPress}
          disabled={wishlistLoading}
          accessibilityLabel={
            inWishlist ? "Remove from wishlist" : "Add to wishlist"
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: wishlistLoading }}
        >
          {wishlistLoading ? (
            <ActivityIndicator size="small" color={themeColors.text.dark} />
          ) : (
            <Text style={styles.wishlistButtonText}>
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
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButtonsRowRTL: {
    flexDirection: "row-reverse",
  },
  addToCartButtonWrapper: {
    flex: 1,
  },
  addToCartButton: {
    borderRadius: 8,
    paddingVertical: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  wishlistButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    minWidth: 100,
  },
  wishlistButtonDisabled: {
    opacity: 0.6,
  },
  wishlistButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
