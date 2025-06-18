import { useCartStore } from "@/store/useCartStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, TextInput } from "react-native";
import { StyleSheet, View } from "react-native";
const CONSTANTS = {
  iconSize: 24,
  headerIconSize: 20,
  logoSize: 36,
  tabBarRadius: 20,
  tabBarMargin: 12,
  colors: {
    focused: "#e98c22",
    unfocused: "#6B7280",
    background: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.1)",
    border: "#E5E7EB",
    notification: "#EF4444",
    darkGray: "#374151",
    lightGrayBackground: "#F9FAFB",
    textDark: "#111827",
  },
};
const HeaderComponent: React.FC = () => {
  const router = useRouter();
  const { cart } = useCartStore();

  // استخدام useMemo للتوفير في الريندَر
  const hasProductsInCart = useMemo(() => {
    return cart?.products && cart.products.length > 0;
  }, [cart]);

  return (
    <View style={[styles.headerContainer, styles.header]}>
      <Image
        source={require("../../assets/images/icon.png")} 
        style={styles.headerLogo} 
        contentFit="contain" 
      />

      <TextInput
        placeholder="ابحث عن منتج"
        style={styles.searchInput}
        placeholderTextColor={CONSTANTS.colors.unfocused}
      />

      <View style={styles.headerIcons}>
        <Pressable
          style={styles.iconWithBadge}
          onPress={() => router.push("/notification")} 
        >
          <Ionicons
            name="notifications-outline"
            size={CONSTANTS.headerIconSize + 4}
            color={CONSTANTS.colors.darkGray}
          />
          <View style={styles.notificationBadge} />
        </Pressable>

        {/* أيقونة سلة التسوق */}
        <Pressable onPress={() => router.push("/cart")}>
          <Ionicons
            name="cart-outline"
            size={CONSTANTS.headerIconSize + 4}
            color={CONSTANTS.colors.darkGray}
          />
          {/* عرض الشارة فقط إذا كان هناك المنتجات في السلة */}
          {hasProductsInCart && <View style={styles.notificationBadge} />}
        </Pressable>
      </View>
    </View>
  )
};

export default HeaderComponent;
const styles = StyleSheet.create({
  header: {
    marginTop: 24,
    backgroundColor: CONSTANTS.colors.background,
    elevation: 0, // إزالة الظل في Android
    shadowOpacity: 0, // إزالة الظل في iOS
    borderBottomWidth: 1,
    borderBottomColor: CONSTANTS.colors.border,
    paddingHorizontal: 16, // إضافة مسافة أفقية للرأس
    paddingVertical: 10, // إضافة مسافة رأسية للرأس
  },

  // حاوية الرأس التي تحتوي على الشعار، شريط البحث والأيقونات
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 80,
  },

  // أنماط شعار الرأس
  headerLogo: {
    width: CONSTANTS.logoSize,
    height: CONSTANTS.logoSize,
    borderRadius: 8,
  },

  // أنماط شريط البحث
  searchInput: {
    flex: 1, // السماح لشريط البحث بالتوسع ليملأ المساحة المتاحة
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CONSTANTS.colors.border,
    borderRadius: 20,
    backgroundColor: CONSTANTS.colors.lightGrayBackground,
    fontSize: 14,
    textAlign: "right", // محاذاة النص لليمين للغة العربية
    color: CONSTANTS.colors.textDark,
  },

  // حاوية أيقونات الرأس (الإشعارات وسلة التسوق)
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // مسافة بين الأيقونات
  },

  // نمط لأيقونة تحتوي على شارة
  iconWithBadge: {
    position: "relative",
  },

  // نمط الشارة (النقطة الحمراء للإشعارات أو عدد المنتجات في السلة)
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    backgroundColor: CONSTANTS.colors.notification,
    borderRadius: 4,
    borderWidth: 1.5, // إضافة حد للشارة لجعلها أكثر وضوحًا
    borderColor: CONSTANTS.colors.background,
  },
});
