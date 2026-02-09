import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useAuth, useUser } from "@clerk/clerk-expo";
import useOrderStore from "@/store/orderStore";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/addressStore";
import AddressForm from "@/components/AddressForm";
import CouponInput, { CouponValidationResult } from "./CouponInput";
import CouponRecommendations from "./CouponRecommendations";
import i18n from "@/utils/i18n";
import { useTracking } from "@/hooks/useTracking";
import { useColors } from "@/hooks/useColors";
import { formatPrice } from "@/utils/priceUtils";
import { quoteCheckout } from "@/services/api/checkout.api";
import type { QuoteResponse } from "@/types/checkout.types";
import { extractCartItemAttributes } from "@/utils/cartUtils";
import { normalizeProduct } from "@/domain/product/product.normalize";
import { matchVariant } from "@/domain/variant/variant.match";
import { getFinalPrice } from "@/utils/priceUtils";
import { useRouter } from "expo-router";
import { uploadImageToImageKit } from "@/utils/imageKitUpload";
import { toast } from "sonner-native";
import Colors from "@/locales/brandColors";

type PaymentMethod = "CASH" | "BANKAK";

const PROOF_THRESHOLD = 25000;

const toPlainObject = (x: any) => {
  if (!x) return {};
  if (x instanceof Map) return Object.fromEntries(x.entries());
  if (typeof x === "object") return x;
  return {};
};

// ✅ backend requires these based on validation
const buildShippingAddressText = (a: any) => {
  const parts = [
    a?.name,
    a?.city,
    a?.area,
    a?.street,
    a?.building,
    a?.notes ? `ملاحظات: ${a.notes}` : null,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  const text = parts.join(" - ");
  return text.length >= 10 ? text : "";
};

const AddressCard = React.memo(({ item, isSelected, onSelect, colors }: any) => (
  <TouchableOpacity
    style={[
      styles.addressCard,
      { borderColor: colors.borderDark, backgroundColor: colors.cardBackground },
      isSelected && { borderColor: colors.primary, borderWidth: 2 },
    ]}
    onPress={() => onSelect(String(item._id))}
    activeOpacity={0.85}
  >
    <Text style={[styles.addressName, { color: colors.text.darkGray }]}>
      {item.name}{" "}
      {item.isDefault ? (
        <Text style={{ color: colors.primary, fontWeight: "400" }}>({i18n.t("default")})</Text>
      ) : null}
    </Text>

    <Text style={[styles.addressText, { color: colors.text.mediumGray }]}>
      {item.subCityName || item.area}، {item.street}، {item.building}
    </Text>
    <Text style={[styles.addressText, { color: colors.text.mediumGray }]}>📞 {item.phone}</Text>
    {item.notes ? (
      <Text style={[styles.addressText, { color: colors.text.mediumGray }]}>
        {i18n.t("notes")}: {item.notes}
      </Text>
    ) : null}
  </TouchableOpacity>
));

const PaymentSection = React.memo(
  ({
    paymentMethod,
    setPaymentMethod,
    currentTotal,
    payableAmountText,
    transferImage,
    setTransferImage,
    uploadingImage,
    pickImage,
    colors,
  }: any) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.darkGray }]}>{i18n.t("paymentMethod")}</Text>

      {currentTotal < PROOF_THRESHOLD ? (
        <TouchableOpacity
          style={[
            styles.paymentOption,
            { borderColor: colors.borderDark, backgroundColor: colors.cardBackground },
            paymentMethod === "CASH" && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => {
            setPaymentMethod("CASH");
            setTransferImage(null);
          }}
          activeOpacity={0.85}
        >
          <View style={[styles.radioOuter, { borderColor: colors.borderDark }]}>
            {paymentMethod === "CASH" && (
              <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
            )}
          </View>

          <View style={styles.paymentContent}>
            <Text style={[styles.paymentTitle, { color: colors.text.darkGray }]}>{i18n.t("cashPayment")}</Text>
            <Text style={[styles.paymentDesc, { color: colors.text.mediumGray }]}>{i18n.t("cashPaymentDescription")}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.warningBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
          <Text style={[styles.warningText, { color: colors.warning }]}>
            {i18n.t("bankakPaymentWarning")} {formatPrice(PROOF_THRESHOLD)}، {i18n.t("attachTransferImage")}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.paymentOption,
          { borderColor: colors.borderDark, backgroundColor: colors.cardBackground },
          paymentMethod === "BANKAK" && { borderColor: colors.primary, borderWidth: 2 },
        ]}
        onPress={() => setPaymentMethod("BANKAK")}
        activeOpacity={0.85}
      >
        <View style={[styles.radioOuter, { borderColor: colors.borderDark }]}>
          {paymentMethod === "BANKAK" && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
        </View>

        <View style={styles.paymentContent}>
          <Text style={[styles.paymentTitle, { color: colors.text.darkGray }]}>{i18n.t("bankakPayment")}</Text>
          <Text style={[styles.paymentDesc, { color: colors.text.mediumGray }]}>
            {i18n.t("bankakPaymentDescription")} {payableAmountText} {i18n.t("attachTransferImage")}
          </Text>

          {paymentMethod === "BANKAK" && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.paymentDetail, { color: colors.text.mediumGray }]}>{i18n.t("accountNumber")}: {i18n.t("accountNumberValue")}</Text>
              <Text style={[styles.paymentDetail, { color: colors.text.mediumGray }]}>{i18n.t("accountName")}: {i18n.t("accountNameValue")}</Text>
              <Text style={[styles.paymentDetail, { color: colors.text.mediumGray }]}>{i18n.t("bankName")}: {i18n.t("bankNameValue")}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {paymentMethod === "BANKAK" && (
        <View style={[styles.uploadSection, { backgroundColor: colors.gray?.[100] ?? "#F3F4F6" }]}>
          <Text style={[styles.uploadLabel, { color: colors.text.darkGray }]}>{i18n.t("attachTransferImage")} *</Text>

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
              {transferImage ? i18n.t("changeImage") : i18n.t("selectImage")}
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
  )
);

const PriceSummary = React.memo(({ quote, couponResult, orderAmount, colors }: any) => (
  <View>
    {couponResult?.valid && typeof couponResult.discountAmount === "number" ? (
      <View style={[styles.priceSection, { backgroundColor: colors.gray?.[100] ?? "#F3F4F6" }]}>
        <Text style={[styles.discountText, { color: colors.success }]}>
          {i18n.t("discount")}: {formatPrice(couponResult.discountAmount)}
          {couponResult.type === "percentage" ? ` (${couponResult.value}%)` : ""}
        </Text>
        <Text style={[styles.totalText, { color: colors.text.darkGray }]}>
          {i18n.t("totalAfterDiscount")}: {formatPrice(couponResult.finalAmount ?? orderAmount)}
        </Text>
      </View>
    ) : null}

    {quote ? (
      <View style={[styles.priceSection, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.totalText, { color: colors.text.darkGray }]}>
          {i18n.t("total")}: {formatPrice(quote.subtotal)}
        </Text>
        <Text style={[styles.discountText, { color: colors.text.mediumGray }]}>
          {i18n.t("shipping")}: {formatPrice(quote.shippingFee)}
        </Text>
        <Text style={[styles.totalText, { color: colors.primary, marginTop: 4 }]}>
          {i18n.t("grandTotal")}: {formatPrice(quote.total)}
        </Text>
      </View>
    ) : null}
  </View>
));

const CheckoutButton = React.memo(({ isEnabled, isLoading, onCheckout, colors }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      { backgroundColor: colors.primary },
      !isEnabled && { backgroundColor: colors.gray?.[400] ?? "#9CA3AF" },
      { zIndex: 10 },
    ]}
    onPress={onCheckout}
    disabled={!isEnabled}
    activeOpacity={0.85}
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  >
    <Text style={[styles.buttonText, { color: colors.text.white }]}>
      {isLoading ? i18n.t("loading") : i18n.t("checkout")}
    </Text>
  </TouchableOpacity>
));

export default function CheckOutModal({ handleClose }: { handleClose: () => void }) {
  const router = useRouter();
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
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transferImage, setTransferImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch addresses (once)
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let mounted = true;
    (async () => {
      try {
        if (!mounted) return;
        await fetchAddresses();
      } catch (err) {
        console.warn("Initial fetchAddresses failed", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchAddresses]);

  const orderAmount = useMemo(() => quote?.subtotal ?? cart?.totalPrice ?? 0, [quote?.subtotal, cart?.totalPrice]);

  const payableAmountText = useMemo(() => {
    const baseAmount = quote?.total ?? orderAmount;
    const amount =
      couponResult && couponResult.valid && typeof couponResult.finalAmount === "number"
        ? couponResult.finalAmount
        : baseAmount;
    return formatPrice(amount);
  }, [couponResult, orderAmount, quote?.total]);

  const currentTotal = useMemo(() => couponResult?.finalAmount ?? quote?.total ?? orderAmount, [couponResult, quote, orderAmount]);

  const itemsPayload = useMemo(() => {
    if (!cart?.products?.length) return [];

    return cart.products
      .map((item: any) => {
        const raw = item?.product;
        const productId = raw?._id ? String(raw._id) : null;
        if (!productId) return null;

        const p = normalizeProduct(raw);
        const attrs = toPlainObject(extractCartItemAttributes(item));
        const v = matchVariant(p, attrs);

        const unitPriceRaw = getFinalPrice(p, { variant: v });
        const unitPrice = Number(unitPriceRaw);
        const quantity = Number(item?.quantity ?? 1);

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) return null;
        if (!Number.isFinite(quantity) || quantity <= 0) return null;

        return {
          productId,
          quantity,
          variantId: v?._id ? String(v._id) : undefined,
          attributes: attrs,
          unitPrice,
        };
      })
      .filter(Boolean);
  }, [cart?.updatedAt]);

  const refreshQuote = useCallback(
    async (addressId: string | null) => {
      if (!addressId || !itemsPayload.length) return;
      try {
        setQuoteLoading(true);
        // ⚠️ your quote endpoint returns 404 sometimes - do not break UI
        const data = await quoteCheckout({ addressId, items: itemsPayload });
        setQuote(data);
      } catch (error: any) {
        console.warn("quote failed", error?.message);
      } finally {
        setQuoteLoading(false);
      }
    },
    [itemsPayload]
  );

  const isCheckoutEnabled = useMemo(() => {
    if (!selectedAddressId) return false;
    if (!paymentMethod) return false;

    const selectedAddress = (addresses || []).find((a: any) => String(a._id) === String(selectedAddressId));
    if (selectedAddress && (!selectedAddress.phone)) return false;

    if (!itemsPayload.length) return false;
    if (paymentMethod === "BANKAK") {
      if (!transferImage || !String(transferImage).startsWith("http")) return false;
    }
    if (currentTotal >= PROOF_THRESHOLD && paymentMethod === "CASH") return false;

    if (uploadingImage) return false;
    if (isLoading || quoteLoading) return false;

    return true;
  }, [
    selectedAddressId,
    paymentMethod,
    transferImage,
    uploadingImage,
    isLoading,
    quoteLoading,
    addresses,
    currentTotal,
    itemsPayload.length,
  ]);

  const checkoutDisabledReason = useMemo(() => {
    if (!selectedAddressId) return i18n.t("selectShippingAddress");
    if (!paymentMethod) return i18n.t("selectPaymentMethod");

    const selectedAddress = (addresses || []).find((a: any) => String(a._id) === String(selectedAddressId));
    if (!selectedAddress) return i18n.t("addressNotFound");
    if (!selectedAddress.phone) return i18n.t("addPhoneNumberToAddress");
    if (!itemsPayload.length) return i18n.t("cartHasIncompleteProducts");
    if (paymentMethod === "BANKAK") {
      if (uploadingImage) return i18n.t("uploadingTransferImage");
      if (!transferImage) return i18n.t("attachTransferImage");
      if (!String(transferImage).startsWith("http")) return i18n.t("waitForImageUpload");
    }

    if (currentTotal >= PROOF_THRESHOLD && paymentMethod === "CASH") return i18n.t("cashPaymentAboveThreshold");

    if (isLoading) return i18n.t("loading");
    if (quoteLoading) return i18n.t("loading");

    return null;
  }, [
    selectedAddressId,
    paymentMethod,
    addresses,
    transferImage,
    uploadingImage,
    currentTotal,
    isLoading,
    quoteLoading,
    itemsPayload.length,
  ]);

  // Auto select default address
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;
    if (selectedAddressId) return;

    const def = addresses.find((a: any) => a.isDefault) || addresses[0];
    if (def?._id) {
      setSelectedAddressId(String(def._id));
      refreshQuote(String(def._id));
    }
  }, [addresses, refreshQuote, selectedAddressId]);

  // Refresh quote on address/cart changes
  useEffect(() => {
    if (selectedAddressId) refreshQuote(selectedAddressId);
  }, [selectedAddressId, cart?.updatedAt, refreshQuote]);

  const handleAddAddress = useCallback(
    async (form: Omit<any, "_id">) => {
      try {
        setIsLoading(true);
        const newAddress = await addAddress(form);
        await fetchAddresses();
        setShowAddressForm(false);

        if (newAddress?._id) {
          setSelectedAddressId(String(newAddress._id));
          refreshQuote(String(newAddress._id));
        }

        toast.success(i18n.t("addressAddedSuccessfully"));
      } catch (e: any) {
        toast.error(e?.message || i18n.t("addressAddError"));
      } finally {
        setIsLoading(false);
      }
    },
    [addAddress, fetchAddresses, refreshQuote]
  );

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error(i18n.t("imagePermissionError"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [9, 16],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;

      // show local immediately (preview)
      setTransferImage(uri);

      setUploadingImage(true);
      try {
        const uploadedUrl = await uploadImageToImageKit(uri);
        setTransferImage(uploadedUrl);
      } catch (error) {
        toast.error(i18n.t("imageUploadFailed"));
        setTransferImage(null);
      } finally {
        setUploadingImage(false);
      }
    }
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!selectedAddressId) return toast.error(i18n.t("selectShippingAddress"));
    if (!paymentMethod) return toast.error(i18n.t("selectPaymentMethod"));
    if (!itemsPayload.length) {
      return toast.error(i18n.t("cartHasIncompleteProducts"));
    }
    if (paymentMethod === "BANKAK") {
      if (!transferImage || !String(transferImage).startsWith("http")) {
        return toast.error(i18n.t("attachTransferImage"));
      }
    }
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("AUTH_ERROR");

      const selectedAddress = (addresses || []).find((a: any) => String(a._id) === String(selectedAddressId));
      if (!selectedAddress) throw new Error("ADDRESS_NOT_FOUND");
      if (!selectedAddress.phone) throw new Error("ADDRESS_PHONE_MISSING");
      // ✅ backend requires these fields
      const shippingAddress = buildShippingAddressText(selectedAddress);
      const phoneNumber = String(selectedAddress.phone).trim();
      if (!shippingAddress) {
        return toast.error(i18n.t("shippingAddressMissing"));
      }
      if (!phoneNumber || phoneNumber.length < 5) {
        return toast.error(i18n.t("invalidPhoneNumber"));
      }
      // quote endpoint might be 404 - do not block order
      try {
        await refreshQuote(selectedAddressId);
      } catch { }

      const orderPayload: any = {
        // ✅ required by backend (per validation error)
        shippingAddress,
        phoneNumber,

        // keep addressId as well (harmless / might be used)
        addressId: selectedAddressId,

        paymentMethod,
        items: itemsPayload,

        // proof
        transferProof: paymentMethod === "BANKAK" ? transferImage : undefined,
        paymentProofUrl: paymentMethod === "BANKAK" ? transferImage : undefined,
      };

      console.log("ORDER_PAYLOAD", JSON.stringify(orderPayload, null, 2));

      const order = await createOrder(orderPayload);

      // Track purchase
      if (itemsPayload.length) {
        const orderId = order?._id || order?.id || null;
        itemsPayload.forEach((it: any) => {
          trackEvent("purchase", {
            productId: it?.productId,
            orderId,
            screen: "checkout",
            price: it?.unitPrice ?? 0, // ✅ fixed
            quantity: it?.quantity ?? 1,
            paymentMethod,
          });
        });
      }

      await clearCart();
      handleClose();
      toast.success(i18n.t("orderSuccess"));
      router.push({
        pathname: "/order-success",
        params: {
          orderId: order?._id || order?.id,
          orderNumber: order?.orderNumber,
        },
      });
    } catch (e: any) {
      const errData = e?.response?.data;
      const details = errData?.error?.details;

      console.log("CREATE_ORDER_ERROR_RAW", JSON.stringify(errData, null, 2));
      console.log("CREATE_ORDER_ERROR_DETAILS", JSON.stringify(details, null, 2));

      const status = e?.response?.status;
      const serverMsg =
        errData?.error?.message ||
        errData?.message ||
        e?.message ||
        i18n.t("orderError");

      toast.error(status ? `${serverMsg} (HTTP ${status})` : serverMsg || i18n.t("orderError"));

      // ❌ do NOT close on failure
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedAddressId,
    paymentMethod,
    transferImage,
    getToken,
    addresses,
    refreshQuote,
    itemsPayload,
    createOrder,
    clearCart,
    handleClose,
    trackEvent,
    router,
  ]);

  // render address item
  const renderAddress = useCallback(
    ({ item }: { item: any }) => {
      const isSelected = String(selectedAddressId) === String(item._id);
      return (
        <AddressCard
          item={item}
          isSelected={isSelected}
          onSelect={(id: string) => setSelectedAddressId(String(id))}
          colors={colors}
        />
      );
    },
    [selectedAddressId, colors]
  );

  const renderFooter = useCallback(() => {
    return (
      <View style={styles.innerContainer}>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.primary, backgroundColor: colors.cardBackground }]}
          onPress={() => {
            setAddressFormInitial(null);
            setShowAddressForm(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.addButtonText, { color: colors.primary }]}>{i18n.t("addNewAddress")}</Text>
        </TouchableOpacity>

        <PaymentSection
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          currentTotal={currentTotal}
          payableAmountText={payableAmountText}
          transferImage={transferImage}
          setTransferImage={setTransferImage}
          uploadingImage={uploadingImage}
          pickImage={pickImage}
          colors={colors}
        />
        {!!cart?.products?.length && orderAmount > 0 ? (
          <CouponRecommendations
            cartItems={cart.products}
            orderAmount={orderAmount}
            onCouponSelect={(coupon) => {
              setCouponResult({
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
              });
            }}
          />
        ) : null}

        {!!cart?.products?.length ? (
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

        <PriceSummary quote={quote} couponResult={couponResult} orderAmount={orderAmount} colors={colors} />

        <CheckoutButton isEnabled={isCheckoutEnabled} isLoading={isLoading || uploadingImage} onCheckout={handleCheckout} colors={colors} />

        {!isCheckoutEnabled && checkoutDisabledReason ? (
          <Text style={{ marginTop: 10, color: colors.text.mediumGray, textAlign: "right" }}>
            {checkoutDisabledReason}
          </Text>
        ) : null}

        <View style={{ height: 20 }} />
      </View>
    );
  }, [
    colors,
    paymentMethod,
    currentTotal,
    payableAmountText,
    transferImage,
    uploadingImage,
    pickImage,
    cart?.products,
    orderAmount,
    quote,
    couponResult,
    isCheckoutEnabled,
    isLoading,
    handleCheckout,
    user?.id,
    checkoutDisabledReason,
  ]);

  if (showAddressForm) {
    return (
      <AddressForm
        visible={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSubmit={handleAddAddress}
        initialValues={addressFormInitial as Omit<any, "_id"> | undefined}
      />
    );
  }

  if (isAddressesLoading) {
    return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
  }

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
          <Text style={[styles.addButtonText, { color: colors.primary }]}>{i18n.t("addNewAddress")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={addresses}
      keyExtractor={(item: any) => String(item._id)}
      renderItem={renderAddress}
      extraData={{
        selectedAddressId,
        paymentMethod,
        transferImage,
        uploadingImage,
        isCheckoutEnabled,
        isLoading,
        quoteLoading,
        currentTotal,
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.container, { backgroundColor: colors.surface }]}
      ListHeaderComponent={
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.darkGray }]}>{i18n.t("addresses")}</Text>
          </View>
        </View>
      }
      ListFooterComponent={() => renderFooter()}
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
    color: Colors.primary,
    lineHeight: 34,
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
    lineHeight: 24,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
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
    lineHeight: 24,
  },

  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    lineHeight: 24,
  },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    lineHeight: 24,
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
    lineHeight: 24,
  },
  paymentDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  paymentDetail: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 20,
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
    lineHeight: 20,
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    lineHeight: 24,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 24,
  },
  imagePreview: {
    marginTop: 12,
    position: "relative",
    lineHeight: 20,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    lineHeight: 20,
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
    lineHeight: 20,
  },
  removeImageText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 24,
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
    lineHeight: 24,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 24,
  },

  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "right",
  },
});
