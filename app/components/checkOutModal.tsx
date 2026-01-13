import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  I18nManager,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import useOrderStore from "@/store/orderStore";
import CouponInput, { CouponValidationResult } from "./CouponInput";
import CouponRecommendations from "./CouponRecommendations";
import { useAuth } from "@clerk/clerk-expo";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/addressStore";
import AddressForm, { Address } from "./AddressForm";
import { useUser } from "@clerk/clerk-expo";
import i18n from "@/utils/i18n";
import { ScrollView } from "react-native-gesture-handler";
import Colors from "@/locales/brandColors";
import useTracking from "@/hooks/useTracking";
import { useColors } from "@/hooks/useColors";

type PaymentMethod = "cash" | "card";

export default function CheckOutModal({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const Colors = useColors();
  const {
    addresses,
    fetchAddresses,
    addAddress,
    isLoading: isAddressesLoading,
  } = useAddressStore();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { createOrder } = useOrderStore();
  const { clearCart, cart } = useCartStore();
  const { trackEvent } = useTracking();
  const [couponResult, setCouponResult] =
    useState<CouponValidationResult | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormInitial, setAddressFormInitial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Payment method states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transferImage, setTransferImage] = useState<string | null>(null);

  useEffect(() => {
    getToken().then((token) => fetchAddresses(token));
  }, []);

  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find((a: Address) => a.isDefault) || addresses[0];
      setSelectedAddressId(def && def._id ? def._id! : null);
    }
  }, [addresses.length]);

  const handleAddAddress = async (form: Omit<Address, "_id">) => {
    const token = await getToken();
    console.log("Submitting new address:", form);
    try {
      await addAddress(form, token);
      console.log("Address added, fetching addresses...");
      await fetchAddresses(token);
      setShowAddressForm(false);
      setTimeout(() => {
        const latest =
          addresses.find((a: Address) => a.isDefault) ||
          addresses[addresses.length - 1];
        setSelectedAddressId(latest && latest._id ? latest._id : null);
      }, 300);
      Alert.alert("تمت الإضافة", "تم إضافة العنوان بنجاح");
    } catch (err) {
      console.log("Error adding address:", err);
      Alert.alert("خطأ", "حدث خطأ أثناء إضافة العنوان");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("خطأ", "نحتاج إلى إذن الوصول للصور");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      aspect: [9,16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTransferImage(result.assets[0].uri);
    }
  };

  const isCheckoutEnabled = () => {
    if (!selectedAddressId) return false;
    if (!paymentMethod) return false;
    if (paymentMethod === "card" && !transferImage) return false;
    return true;
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert("خطأ", "يرجى اختيار عنوان للتوصيل");
      return;
    }
    if (!paymentMethod) {
      Alert.alert("خطأ", "يرجى اختيار طريقة الدفع");
      return;
    }
    if (paymentMethod === "card" && !transferImage) {
      Alert.alert("خطأ", "يرجى إرفاق صورة التحويل البنكي");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      const selectedAddress = addresses.find(
        (a: Address) => a._id === selectedAddressId
      );
      if (!selectedAddress) throw new Error("العنوان غير موجود");
      
      const orderPayload = {
        deliveryAddress: selectedAddress,
        paymentMethod: paymentMethod,
        ...(transferImage && { transferProof: transferImage }),
        ...(couponResult && couponResult.valid
          ? { couponCode: couponResult.code }
          : {}),
      };
      
      if (token) {
        const order = await createOrder(orderPayload, token);
        
        // Track purchase event
        if (cart?.products) {
          const orderId = order?._id || order?.id || null;
          cart.products.forEach((item) => {
            trackEvent('purchase', {
              productId: item.product._id,
              orderId: orderId,
              screen: 'checkout',
              price: item.product.finalPrice || item.product.discountPrice || item.product.price || 0,
              quantity: item.quantity,
            });
          });
        }
        
        await clearCart();
        Alert.alert("نجح", "تم تأكيد الطلب بنجاح!");
        handleClose();
      } else {
        Alert.alert("خطأ", "حدث خطأ في المصادقة");
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء إرسال الطلب");
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (isAddressesLoading)
    return (
      <ActivityIndicator
        size="large"
        color={Colors.primary}
        style={{ flex: 1 }}
      />
    );
  if (showAddressForm) {
    return (
      <AddressForm
        visible={true}
        onClose={() => {
          setShowAddressForm(false);
        }}
        onSubmit={handleAddAddress}
        initialValues={addressFormInitial}
      />
    );
  }

  if (addresses.length === 0) {
    return (
      <View
        style={[
          styles.innerContainer,
          {
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setAddressFormInitial(null);
            setShowAddressForm(true);
          }}
        >
          <Text style={styles.addButtonText}>+ {i18n.t("addNewAddress")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{i18n.t("addresses")}</Text>
        </View>
        
        <FlatList
          data={addresses}
          keyExtractor={(item: Address) => item._id as string}
          renderItem={({ item }: { item: Address }) => (
            <TouchableOpacity
              style={[
                styles.addressCard,
                selectedAddressId === item._id && styles.selectedCard,
              ]}
              onPress={() => setSelectedAddressId(item._id || null)}
            >
              <Text style={styles.addressName}>
                {item.name}{" "}
                {item.isDefault && (
                  <Text style={styles.defaultText}>(افتراضي)</Text>
                )}
              </Text>
              <Text style={styles.addressText}>
                {item.city}، {item.area}، {item.street}، {item.building}
              </Text>
              <Text style={styles.addressText}>📞 {item.phone}</Text>
              {item.notes ? (
                <Text style={styles.addressText}>
                  {i18n.t("notes")}: {item.notes}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{i18n.t("noAddresses")}</Text>
          }
        />
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setAddressFormInitial(null);
            setShowAddressForm(true);
          }}
        >
          <Text style={styles.addButtonText}>+ إضافة عنوان جديد</Text>
        </TouchableOpacity>

        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "cash" && styles.selectedPayment,
            ]}
            onPress={() => {
              setPaymentMethod("cash");
              setTransferImage(null);
            }}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "cash" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>الدفع عند الاستلام</Text>
              <Text style={styles.paymentDesc}>ادفع نقداً عند استلام الطلب</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "card" && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod("card")}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "card" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>التحويل البنكي</Text>
              <Text style={styles.paymentDesc}>
                حول مبلغ {
                  couponResult && couponResult.valid && couponResult.finalAmount
                    ? couponResult.finalAmount.toFixed(2)
                    : cart.totalPrice
                } وأرفق صورة الإيصال
              </Text>
              {paymentMethod === "card" && (
                <View style={styles.paymentDetail}>
                  <Text style={styles.paymentDetail}>
                    رقم الحساب: 5831233
                  </Text>
                  <Text style={styles.paymentDetail}>
                   الاسم : سعيد عبدالجبار
                  </Text>
                  <Text style={styles.paymentDetail}>
                    البنك : بنك الخرطوم
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Bank Transfer Image Upload */}
          {paymentMethod === "card" && (
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>إرفاق صورة التحويل البنكي *</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
              >
                <Text style={styles.uploadButtonText}>
                  {transferImage ? "تغيير الصورة" : "اختيار صورة"}
                </Text>
              </TouchableOpacity>
              {transferImage && (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: transferImage }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setTransferImage(null)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Coupon Recommendations */}
        {cart && cart.products && cart.products.length > 0 && cart.totalPrice > 0 && (
          <CouponRecommendations
            cartItems={cart.products}
            orderAmount={cart.totalPrice || 0}
            onCouponSelect={(coupon) => {
              // Auto-fill the coupon input with selected recommendation
              const validationResult: CouponValidationResult = {
                code: coupon.code,
                valid: true,
                type: coupon.type,
                value: coupon.value,
                discountAmount: coupon.discountPreview?.discountAmount || 0,
                originalAmount: coupon.discountPreview?.originalAmount || cart.totalPrice,
                finalAmount: coupon.discountPreview?.finalAmount || cart.totalPrice,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount,
                message: 'Coupon selected from recommendations',
              };
              setCouponResult(validationResult);
            }}
          />
        )}

        {/* Coupon Section */}
        {cart && cart.products && cart.products.length > 0 && (
          <CouponInput
            products={cart.products.map((item: any) => ({
              productId: item.product._id,
              categoryId: item.product.category,
            }))}
            userId={user?.id || ""}
            orderAmount={cart.totalPrice || 0}
            cartItems={cart.products}
            onValidate={setCouponResult}
          />
        )}

        {/* Discount & Total */}
        {couponResult && couponResult.valid && cart && cart.totalPrice && (
          <View style={styles.priceSection}>
            <Text style={styles.discountText}>
              الخصم: {couponResult.discountAmount?.toFixed(2) || 0} ج.س
              {couponResult.type === "percentage" && ` (${couponResult.value}%)`}
            </Text>
            <Text style={styles.totalText}>
              المجموع بعد الخصم:{" "}
              {couponResult.finalAmount?.toFixed(2) || 
                Math.max(0, (couponResult.originalAmount || cart.totalPrice) - (couponResult.discountAmount || 0))
              }{" "}
              ج.س
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            !isCheckoutEnabled() && styles.buttonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={!isCheckoutEnabled() || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "جاري التأكيد..." : "تأكيد الطلب"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    backgroundColor: Colors.surface,
    width: "100%",
  },
  innerContainer: {
    padding: 20,
    paddingBottom: 50,
    width: "100%",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.text.darkGray,
  },
  addressCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: Colors.background,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text.darkGray,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: Colors.text.mediumGray,
    marginBottom: 4,
  },
  defaultText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "normal",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.lightGray,
    textAlign: "center",
    marginTop: 20,
  },
  addButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.darkGray,
    marginBottom: 12,
  },
  paymentDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: Colors.background,
  },
  selectedPayment: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  paymentContent: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text.darkGray,
    marginBottom: 4,
  },
  
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.darkGray,
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 13,
    color: Colors.text.mediumGray,
  },
  uploadSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
  },
  uploadLabel: {
    fontSize: 14,
    color: Colors.text.darkGray,
    marginBottom: 12,
    fontWeight: "500",
  },
  uploadButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 15,
    color: Colors.text.mediumGray,
  },
  imagePreview: {
    marginTop: 12,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: Colors.background,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  removeImageText: {
    fontSize: 16,
    color: Colors.text.mediumGray,
  },
  priceSection: {
    padding: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    marginBottom: 20,
  },
  discountText: {
    fontSize: 15,
    color: Colors.success,
    fontWeight: "600",
    marginBottom: 6,
  },
  totalText: {
    fontSize: 16,
    color: Colors.text.darkGray,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.white,
  },
});