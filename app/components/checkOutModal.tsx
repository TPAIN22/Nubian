import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { useAuth, useUser } from "@clerk/clerk-expo";

import useOrderStore from "@/store/orderStore";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/addressStore";

import AddressForm, { Address } from "./AddressForm";
import CouponInput, { CouponValidationResult } from "./CouponInput";
import CouponRecommendations from "./CouponRecommendations";

import i18n from "@/utils/i18n";
import useTracking from "@/hooks/useTracking";
import { useColors } from "@/hooks/useColors";
import { uploadImageToImageKit } from "@/utils/imageKitUpload";
import { formatPrice } from "@/utils/priceUtils";

type PaymentMethod = "cash" | "bank_transfer";

export default function CheckOutModal({ handleClose }: { handleClose: () => void }) {
  const colors = useColors();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { trackEvent } = useTracking();

  const { createOrder } = useOrderStore();
  const { clearCart, cart } = useCartStore();

  const { addresses, fetchAddresses, addAddress, isLoading: isAddressesLoading } = useAddressStore();

  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormInitial, setAddressFormInitial] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transferImage, setTransferImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch addresses
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        if (!mounted) return;
        await fetchAddresses(token);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [getToken, fetchAddresses]);

  // Auto select default address
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;
    const def = addresses.find((a: Address) => a.isDefault) || addresses[0];
    setSelectedAddressId(def?._id ?? null);
  }, [addresses]);

  const orderAmount = useMemo(() => cart?.totalPrice ?? 0, [cart?.totalPrice]);

  const payableAmountText = useMemo(() => {
    const amount =
      couponResult && couponResult.valid && typeof couponResult.finalAmount === "number"
        ? couponResult.finalAmount
        : orderAmount;
    return formatPrice(amount, "SDG");
  }, [couponResult, orderAmount]);

  const isCheckoutEnabled = useMemo(() => {
    if (!selectedAddressId) return false;
    if (!paymentMethod) return false;
    if (paymentMethod === "bank_transfer" && !transferImage) return false;
    if (uploadingImage) return false;
    if (isLoading) return false;
    return true;
  }, [selectedAddressId, paymentMethod, transferImage, uploadingImage, isLoading]);

  const handleAddAddress = useCallback(
    async (form: Omit<Address, "_id">) => {
      const token = await getToken();
      try {
        await addAddress(form, token);
        await fetchAddresses(token);
        setShowAddressForm(false);

        // pick last/default after refresh
        setTimeout(() => {
          const def = addresses.find((a: Address) => a.isDefault) || addresses[addresses.length - 1];
          setSelectedAddressId(def?._id ?? null);
        }, 250);

        Alert.alert("تمت الإضافة", "تم إضافة العنوان بنجاح");
      } catch (err) {
        Alert.alert("خطأ", "حدث خطأ أثناء إضافة العنوان");
      }
    },
    [getToken, addAddress, fetchAddresses, addresses]
  );

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("خطأ", "نحتاج إلى إذن الوصول للصور");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [9, 16],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setTransferImage(result.assets[0].uri);
    }
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!selectedAddressId) return Alert.alert("خطأ", "يرجى اختيار عنوان للتوصيل");
    if (!paymentMethod) return Alert.alert("خطأ", "يرجى اختيار طريقة الدفع");
    if (paymentMethod === "bank_transfer" && !transferImage) {
      return Alert.alert("خطأ", "يرجى إرفاق صورة التحويل البنكي");
    }

    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("AUTH_ERROR");

      const selectedAddress = addresses.find((a: Address) => a._id === selectedAddressId);
      if (!selectedAddress) throw new Error("ADDRESS_NOT_FOUND");

      let uploadedImageUrl: string | null = null;

      // Upload proof if bank transfer
      if (paymentMethod === "bank_transfer" && transferImage) {
        try {
          setUploadingImage(true);
          uploadedImageUrl = await uploadImageToImageKit(transferImage);
        } catch (e: any) {
          Alert.alert("خطأ في رفع الصورة", e?.message || "فشل رفع صورة التحويل البنكي. حاول مرة أخرى.");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const orderPayload: any = {
        deliveryAddress: selectedAddress,
        paymentMethod,
        ...(uploadedImageUrl ? { transferProof: uploadedImageUrl } : {}),
        ...(couponResult?.valid ? { couponCode: couponResult.code } : {}),
      };

      const order = await createOrder(orderPayload);

      // Track purchase
      if (cart?.products?.length) {
        const orderId = order?._id || order?.id || null;
        cart.products.forEach((item: any) => {
          trackEvent("purchase", {
            productId: item?.product?._id,
            orderId,
            screen: "checkout",
            price:
              item?.product?.finalPrice ??
              item?.product?.merchantPrice ??
              item?.product?.price ??
              0,
            quantity: item?.quantity ?? 1,
            paymentMethod,
          });
        });
      }

      await clearCart();
      Alert.alert("نجح", "تم تأكيد الطلب بنجاح!");
      handleClose();
    } catch (e: any) {
      if (e?.message === "AUTH_ERROR") Alert.alert("خطأ", "حدث خطأ في المصادقة");
      else if (e?.message === "ADDRESS_NOT_FOUND") Alert.alert("خطأ", "العنوان غير موجود");
      else Alert.alert("خطأ", "حدث خطأ أثناء إرسال الطلب");
      handleClose();
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedAddressId,
    paymentMethod,
    transferImage,
    getToken,
    addresses,
    couponResult,
    createOrder,
    cart?.products,
    clearCart,
    handleClose,
    trackEvent,
  ]);

  // Address form screen
  if (showAddressForm) {
    return (
      <AddressForm
        visible={true}
        onClose={() => setShowAddressForm(false)}
        onSubmit={handleAddAddress}
        initialValues={addressFormInitial}
      />
    );
  }

  // Loading addresses
  if (isAddressesLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  }

  // No addresses
  if (!addresses || addresses.length === 0) {
    return (
      <View style={[styles.centerWrap, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.primary, backgroundColor: colors.cardBackground }]}
          onPress={() => {
            setAddressFormInitial(null);
            setShowAddressForm(true);
          }}
        >
          <Text style={[styles.addButtonText, { color: colors.primary }]}>+ {i18n.t("addNewAddress")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderAddress = ({ item }: { item: Address }) => {
    const isSelected = selectedAddressId === item._id;
    return (
      <TouchableOpacity
        style={[
          styles.addressCard,
          { borderColor: colors.borderDark, backgroundColor: colors.cardBackground },
          isSelected && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => setSelectedAddressId(item._id || null)}
        activeOpacity={0.85}
      >
        <Text style={[styles.addressName, { color: colors.text.darkGray }]}>
          {item.name}{" "}
          {item.isDefault ? <Text style={{ color: colors.primary, fontWeight: "400" }}>(افتراضي)</Text> : null}
        </Text>

        <Text style={[styles.addressText, { color: colors.text.mediumGray }]}>
          {item.city}، {item.area}، {item.street}، {item.building}
        </Text>

        <Text style={[styles.addressText, { color: colors.text.mediumGray }]}>📞 {item.phone}</Text>

        {item.notes ? (
          <Text style={[styles.addressText, { color: colors.text.mediumGray }]}>
            {i18n.t("notes")}: {item.notes}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={addresses}
      keyExtractor={(item: Address) => String(item._id)}
      renderItem={renderAddress}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { backgroundColor: colors.surface }]}
      ListHeaderComponent={
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.darkGray }]}>{i18n.t("addresses")}</Text>
          </View>
        </View>
      }
      ListFooterComponent={
        <View style={styles.innerContainer}>
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.primary, backgroundColor: colors.cardBackground }]}
            onPress={() => {
              setAddressFormInitial(null);
              setShowAddressForm(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.addButtonText, { color: colors.primary }]}>+ إضافة عنوان جديد</Text>
          </TouchableOpacity>

          {/* Payment */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.darkGray }]}>طريقة الدفع</Text>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderColor: colors.borderDark, backgroundColor: colors.cardBackground },
                paymentMethod === "cash" && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => {
                setPaymentMethod("cash");
                setTransferImage(null);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.radioOuter, { borderColor: colors.borderDark }]}>
                {paymentMethod === "cash" && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
              </View>

              <View style={styles.paymentContent}>
                <Text style={[styles.paymentTitle, { color: colors.text.darkGray }]}>الدفع عند الاستلام</Text>
                <Text style={[styles.paymentDesc, { color: colors.text.mediumGray }]}>ادفع نقداً عند استلام الطلب</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderColor: colors.borderDark, backgroundColor: colors.cardBackground },
                paymentMethod === "bank_transfer" && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setPaymentMethod("bank_transfer")}
              activeOpacity={0.85}
            >
              <View style={[styles.radioOuter, { borderColor: colors.borderDark }]}>
                {paymentMethod === "bank_transfer" && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>

              <View style={styles.paymentContent}>
                <Text style={[styles.paymentTitle, { color: colors.text.darkGray }]}>التحويل البنكي</Text>
                <Text style={[styles.paymentDesc, { color: colors.text.mediumGray }]}>
                  حول مبلغ {payableAmountText} وأرفق صورة الإيصال
                </Text>

                {paymentMethod === "bank_transfer" && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.paymentDetail, { color: colors.text.mediumGray }]}>رقم الحساب: 5831233</Text>
                    <Text style={[styles.paymentDetail, { color: colors.text.mediumGray }]}>الاسم: سعيد عبدالجبار</Text>
                    <Text style={[styles.paymentDetail, { color: colors.text.mediumGray }]}>البنك: بنك الخرطوم</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {paymentMethod === "bank_transfer" && (
              <View style={[styles.uploadSection, { backgroundColor: colors.gray?.[100] ?? "#F3F4F6" }]}>
                <Text style={[styles.uploadLabel, { color: colors.text.darkGray }]}>إرفاق صورة التحويل البنكي *</Text>

                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    { backgroundColor: colors.cardBackground, borderColor: colors.borderDark },
                    uploadingImage && { opacity: 0.7 },
                  ]}
                  onPress={pickImage}
                  activeOpacity={0.85}
                  disabled={uploadingImage}
                >
                  <Text style={[styles.uploadButtonText, { color: colors.text.mediumGray }]}>
                    {transferImage ? "تغيير الصورة" : "اختيار صورة"}
                  </Text>
                </TouchableOpacity>

                {!!transferImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: transferImage }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={[
                        styles.removeImageButton,
                        { backgroundColor: colors.cardBackground, borderColor: colors.borderDark },
                      ]}
                      onPress={() => setTransferImage(null)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.removeImageText, { color: colors.text.mediumGray }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Recommendations */}
          {cart?.products?.length && orderAmount > 0 ? (
            <CouponRecommendations
              cartItems={cart.products}
              orderAmount={orderAmount}
              onCouponSelect={(coupon) => {
                const validationResult: CouponValidationResult = {
                  code: coupon.code,
                  valid: true,
                  type: coupon.type,
                  value: coupon.value,
                  discountAmount: coupon.discountPreview?.discountAmount || 0,
                  originalAmount: coupon.discountPreview?.originalAmount || orderAmount,
                  finalAmount: coupon.discountPreview?.finalAmount || orderAmount,
                  minOrderAmount: coupon.minOrderAmount,
                  maxDiscount: coupon.maxDiscount || 0,
                  message: "Coupon selected from recommendations",
                };
                setCouponResult(validationResult);
              }}
            />
          ) : null}

          {/* Coupon input */}
          {cart?.products?.length ? (
            <CouponInput
              products={cart.products.map((item: any) => ({
                productId: item.product._id,
                categoryId: item.product.category,
              }))}
              userId={user?.id || ""}
              orderAmount={orderAmount}
              cartItems={cart.products}
              onValidate={setCouponResult}
            />
          ) : null}

          {/* Discount summary */}
          {couponResult?.valid && typeof couponResult.discountAmount === "number" ? (
            <View style={[styles.priceSection, { backgroundColor: colors.gray?.[100] ?? "#F3F4F6" }]}>
              <Text style={[styles.discountText, { color: colors.success }]}>
                الخصم: {formatPrice(couponResult.discountAmount, "SDG")}
                {couponResult.type === "percentage" ? ` (${couponResult.value}%)` : ""}
              </Text>
              <Text style={[styles.totalText, { color: colors.text.darkGray }]}>
                المجموع بعد الخصم: {formatPrice(couponResult.finalAmount ?? orderAmount, "SDG")}
              </Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              !isCheckoutEnabled && { backgroundColor: colors.gray?.[400] ?? "#9CA3AF" },
            ]}
            onPress={handleCheckout}
            disabled={!isCheckoutEnabled}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, { color: colors.text.white }]}>
              {isLoading || uploadingImage ? "جاري التأكيد..." : "تأكيد الطلب"}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30,
  },
  innerContainer: {
    padding: 20,
    width: "100%",
  },

  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },

  addressCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
  },

  addButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 18,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 13,
  },
  paymentDetail: {
    fontSize: 13,
    marginTop: 3,
  },

  uploadSection: {
    marginTop: 8,
    padding: 16,
    borderRadius: 10,
  },
  uploadLabel: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "700",
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  imagePreview: {
    marginTop: 12,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  removeImageText: {
    fontSize: 16,
    fontWeight: "800",
  },

  priceSection: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  discountText: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "900",
  },

  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "900",
  },
});
