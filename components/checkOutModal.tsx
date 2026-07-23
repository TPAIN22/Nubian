import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  // Plain RN Text for labels on colored button fills — the themed <Text> forces
  // a NativeWind className color that overrides inline color and hides the label.
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Crypto from "expo-crypto";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { toast } from "sonner-native";

import { Text } from "@/components/ui/text";
import useOrderStore from "@/store/orderStore";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/addressStore";
import AddressForm from "@/components/AddressForm";
import type { CouponValidationResult } from "@/components/CouponInput";
import i18n from "@/utils/i18n";
import { useTracking } from "@/hooks/useTracking";
import { formatMoney, formatPrice } from "@/utils/priceUtils";
import { quoteCheckout } from "@/services/api/checkout.api";
import type { QuoteResponse } from "@/types/checkout.types";
import {
  extractCartItemAttributes,
  findMatchingVariant,
} from "@/utils/cartUtils";
import { normalizeProduct } from "@/domain/product/product.normalize";
import { getFinalPrice } from "@/utils/priceUtils";
import { uploadImageToImageKit } from "@/utils/imageKitUpload";
import { classifyError } from "@/utils/apiError";
import {
  bankTransferConfig,
  bankTransferProofThreshold,
} from "@/constants/paymentConfig";
import { isValidPhone } from "@/utils/phoneValidator";
import { computePricing } from "@/utils/computePricing";

import {
  AddressCard,
  BankTransferDetails,
  CheckoutFooter,
  CheckoutHeader,
  CheckoutSection,
  CouponField,
  InlineAlert,
  OrderItemsCard,
  PaymentCard,
  PriceBreakdown,
  PressableScale,
  ShippingMethodCard,
  Skeleton,
  radius,
  spacing,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";

type PaymentMethod = "CASH" | "BANKAK";

const PROOF_THRESHOLD = bankTransferProofThreshold;

const toPlainObject = (x: any) => {
  if (!x) return {};
  if (x instanceof Map) return Object.fromEntries(x.entries());
  if (typeof x === "object") return x;
  return {};
};

// Backend requires a single line ≥ 10 chars. Note: the address controller's
// `ALLOWED_FIELDS` excludes `city`, so addresses created via the API only have
// `cityName`/`subCityName` populated from the location refs. Fall back to the
// legacy `city`/`area` for older records that may still carry them.
const buildShippingAddressText = (a: any) => {
  const parts = [
    a?.name,
    a?.subCityName || a?.area,
    a?.cityName || a?.city,
    a?.countryName,
    a?.street,
    a?.building,
    a?.notes ? `${i18n.t("notes") || "Notes"}: ${a.notes}` : null,
  ]
    .map(v => String(v ?? "").trim())
    .filter(Boolean);
  const text = parts.join(" - ");
  return text.length >= 10 ? text : "";
};

export default function CheckOutModal({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const t = useCheckoutTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { trackEvent } = useTracking();

  const { createOrder } = useOrderStore();
  const { clearCart, cart } = useCartStore();

  const {
    addresses,
    fetchAddresses,
    addAddress,
    isLoading: isAddressesLoading,
  } = useAddressStore();

  const [couponResult, setCouponResult] =
    useState<CouponValidationResult | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormInitial, setAddressFormInitial] = useState<any>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [transferImage, setTransferImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Section open state — Address starts open, others auto-expand as user progresses.
  const [openSections, setOpenSections] = useState({
    address: true,
    delivery: true,
    payment: true,
    promo: false,
  });
  const setSection = useCallback(
    (key: keyof typeof openSections, value: boolean) =>
      setOpenSections(prev => ({ ...prev, [key]: value })),
    [],
  );

  // One idempotency key per attempt; cleared on success so retries are safe.
  const idempotencyKeyRef = useRef<string | null>(null);
  const ensureIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = Crypto.randomUUID();
    }
    return idempotencyKeyRef.current;
  };

  // Fetch addresses once.
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    let mounted = true;
    (async () => {
      try {
        // Warm the Clerk token before the request. The axios interceptor only
        // waits ~500ms for a token before sending unauthenticated; on a cold
        // open that race loses and GET /addresses returns an empty list, so the
        // user's saved addresses stay hidden until a later authenticated call
        // (e.g. adding one) triggers a refetch. Awaiting the token first ensures
        // it's cached and attached on the very first fetch.
        try {
          await getToken();
        } catch {}
        if (!mounted) return;
        await fetchAddresses();
      } catch (err) {
        if (__DEV__) console.warn("Initial fetchAddresses failed", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchAddresses, getToken]);

  const { itemsPayload, invalidItems } = useMemo<{
    itemsPayload: any[];
    invalidItems: {
      productId: string | null;
      name: string;
      reason: "price" | "quantity" | "id";
    }[];
  }>(() => {
    if (!cart?.products?.length) return { itemsPayload: [], invalidItems: [] };

    const valid: any[] = [];
    const invalid: {
      productId: string | null;
      name: string;
      reason: "price" | "quantity" | "id";
    }[] = [];

    for (const item of cart.products as any[]) {
      const raw = item?.product;
      const name = String(raw?.name ?? i18n.t("product"));
      const productId = raw?._id ? String(raw._id) : null;

      if (!productId) {
        invalid.push({ productId: null, name, reason: "id" });
        continue;
      }

      const p = normalizeProduct(raw);
      const attrs = toPlainObject(extractCartItemAttributes(item));
      const v = findMatchingVariant(p, attrs);

      const unitPrice = Number(getFinalPrice(p, { variant: v }));
      const quantity = Number(item?.quantity ?? 1);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        invalid.push({ productId, name, reason: "quantity" });
        continue;
      }
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        invalid.push({ productId, name, reason: "price" });
        continue;
      }

      valid.push({
        productId,
        quantity,
        variantId: v?._id ? String(v._id) : undefined,
        attributes: attrs,
        unitPrice,
      });
    }

    return { itemsPayload: valid, invalidItems: invalid };
  }, [cart?.products, cart?.updatedAt]);

  const hasInvalidItems = invalidItems.length > 0;

  const pricing = useMemo(
    () =>
      computePricing(
        itemsPayload as any,
        quote
          ? { subtotal: quote.subtotal, shippingFee: quote.shippingFee }
          : undefined,
        couponResult
          ? {
              valid: couponResult.valid,
              discountAmount: couponResult.discountAmount,
            }
          : undefined,
      ),
    [itemsPayload, quote?.subtotal, quote?.shippingFee, couponResult],
  );

  const orderAmount = pricing.subtotal;
  const currentTotal = pricing.total;
  const cartCurrency = cart?.currencyCode;

  // USD subtotal from the quote. Coupon values are stored in USD, so coupon
  // lookups validate against this rather than the display subtotal above.
  const orderAmountBase =
    typeof quote?.subtotalBase === "number" ? quote.subtotalBase : null;

  const formatAmount = useCallback(
    (amount: number) =>
      cartCurrency
        ? formatMoney({ amount, currency: cartCurrency })
        : formatMoney(amount),
    [cartCurrency],
  );

  const itemCount = useMemo(
    () =>
      itemsPayload.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0),
    [itemsPayload],
  );

  // Skip refetching same (address+items) signature; debounce bursts.
  const lastQuoteSigRef = useRef<string | null>(null);
  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQuoteSig = useCallback((addressId: string, items: any[]) => {
    const compact = items
      .map(
        it => `${it.productId}:${it.variantId ?? ""}:${it.quantity}`,
      )
      .join("|");
    return `${addressId}#${compact}`;
  }, []);

  const runQuote = useCallback(
    async (addressId: string, items: any[]) => {
      const sig = buildQuoteSig(addressId, items);
      if (sig === lastQuoteSigRef.current) return;
      lastQuoteSigRef.current = sig;
      try {
        setQuoteLoading(true);
        const data = await quoteCheckout({ addressId, items });
        setQuote(data);
      } catch (error: any) {
        if (__DEV__) console.warn("quote failed", error?.message);
        lastQuoteSigRef.current = null;
      } finally {
        setQuoteLoading(false);
      }
    },
    [buildQuoteSig],
  );

  const refreshQuote = useCallback(
    (addressId: string | null) => {
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
      if (!addressId || !itemsPayload.length) return;
      const items = itemsPayload;
      quoteDebounceRef.current = setTimeout(() => {
        runQuote(addressId, items);
      }, 300);
    },
    [itemsPayload, runQuote],
  );

  useEffect(
    () => () => {
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current);
    },
    [],
  );

  const isCheckoutEnabled = useMemo(() => {
    if (!selectedAddressId) return false;
    if (!paymentMethod) return false;
    const selectedAddress = (addresses || []).find(
      (a: any) => String(a._id) === String(selectedAddressId),
    );
    if (selectedAddress && !selectedAddress.phone) return false;
    if (!itemsPayload.length) return false;
    if (hasInvalidItems) return false;
    if (paymentMethod === "BANKAK") {
      if (!transferImage || !String(transferImage).startsWith("http")) return false;
    }
    if (currentTotal >= PROOF_THRESHOLD && paymentMethod === "CASH") return false;
    if (uploadingImage) return false;
    if (isSubmitting || quoteLoading) return false;
    return true;
  }, [
    selectedAddressId,
    paymentMethod,
    transferImage,
    uploadingImage,
    isSubmitting,
    quoteLoading,
    addresses,
    currentTotal,
    itemsPayload.length,
    hasInvalidItems,
  ]);

  const checkoutDisabledReason = useMemo(() => {
    if (!selectedAddressId)
      return i18n.t("selectShippingAddress") || "Select a shipping address";
    if (!paymentMethod)
      return i18n.t("selectPaymentMethod") || "Select a payment method";
    const selectedAddress = (addresses || []).find(
      (a: any) => String(a._id) === String(selectedAddressId),
    );
    if (!selectedAddress)
      return i18n.t("addressNotFound") || "Address not found";
    if (!selectedAddress.phone)
      return (
        i18n.t("addPhoneNumberToAddress") || "Add a phone number to this address"
      );
    if (!itemsPayload.length || hasInvalidItems)
      return (
        i18n.t("cartHasIncompleteProducts") ||
        "Some items can't be ordered. Update your cart."
      );
    if (paymentMethod === "BANKAK") {
      if (uploadingImage)
        return i18n.t("uploadingTransferImage") || "Uploading receipt…";
      if (!transferImage)
        return i18n.t("attachTransferImage") || "Attach a transfer receipt";
      if (!String(transferImage).startsWith("http"))
        return i18n.t("waitForImageUpload") || "Receipt is still uploading";
    }
    if (currentTotal >= PROOF_THRESHOLD && paymentMethod === "CASH")
      return (
        i18n.t("cashPaymentAboveThreshold") ||
        "Cash on delivery isn't available for this order amount"
      );
    if (isSubmitting || quoteLoading) return i18n.t("loading") || "Loading…";
    return null;
  }, [
    selectedAddressId,
    paymentMethod,
    addresses,
    transferImage,
    uploadingImage,
    currentTotal,
    isSubmitting,
    quoteLoading,
    itemsPayload.length,
    hasInvalidItems,
  ]);

  // Auto-select default address & re-validate after address mutations.
  useEffect(() => {
    if (!addresses || addresses.length === 0) {
      if (selectedAddressId) setSelectedAddressId(null);
      return;
    }
    const stillExists =
      selectedAddressId &&
      addresses.some(
        (a: any) => String(a._id) === String(selectedAddressId),
      );
    if (stillExists) return;
    const def = addresses.find((a: any) => a.isDefault) || addresses[0];
    if (def?._id) {
      setSelectedAddressId(String(def._id));
      refreshQuote(String(def._id));
    }
  }, [addresses, refreshQuote, selectedAddressId]);

  // Refresh quote on address/cart change.
  useEffect(() => {
    if (selectedAddressId) refreshQuote(selectedAddressId);
  }, [selectedAddressId, cart?.updatedAt, refreshQuote]);

  // Auto-default to CASH below the threshold so users don't have to pick.
  useEffect(() => {
    if (paymentMethod) return;
    if (currentTotal > 0 && currentTotal < PROOF_THRESHOLD) {
      setPaymentMethod("CASH");
    }
  }, [currentTotal, paymentMethod]);

  const handleAddAddress = useCallback(
    async (form: Omit<any, "_id">) => {
      try {
        setIsSubmitting(true);
        const newAddress = await addAddress(form);
        await fetchAddresses();
        setShowAddressForm(false);
        if (newAddress?._id) {
          setSelectedAddressId(String(newAddress._id));
          refreshQuote(String(newAddress._id));
        }
        toast.success(
          i18n.t("addressAddedSuccessfully") || "Address added",
        );
      } catch (e: any) {
        toast.error(e?.message || i18n.t("addressAddError"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [addAddress, fetchAddresses, refreshQuote],
  );

  const pickImage = useCallback(async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error(i18n.t("imagePermissionError") || "Permission denied");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [9, 16],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setTransferImage(uri); // local preview
      setUploadingImage(true);
      try {
        const uploadedUrl = await uploadImageToImageKit(uri);
        setTransferImage(uploadedUrl);
      } catch {
        toast.error(i18n.t("imageUploadFailed") || "Upload failed");
        setTransferImage(null);
      } finally {
        setUploadingImage(false);
      }
    }
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!isCheckoutEnabled) {
      if (checkoutDisabledReason) toast.error(checkoutDisabledReason);
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("AUTH_ERROR");

      const selectedAddress = (addresses || []).find(
        (a: any) => String(a._id) === String(selectedAddressId),
      );
      if (!selectedAddress) throw new Error("ADDRESS_NOT_FOUND");
      if (!selectedAddress.phone) throw new Error("ADDRESS_PHONE_MISSING");

      const shippingAddress = buildShippingAddressText(selectedAddress);
      const phoneNumber = String(selectedAddress.phone).trim();
      if (!shippingAddress) {
        toast.error(
          i18n.t("shippingAddressMissing") || "Shipping address incomplete",
        );
        return;
      }
      if (!isValidPhone(phoneNumber)) {
        toast.error(i18n.t("invalidPhoneNumber") || "Invalid phone number");
        return;
      }

      // Make sure we have the freshest quote before placing the order.
      try {
        await runQuote(selectedAddressId!, itemsPayload);
      } catch {}

      const idempotencyKey = ensureIdempotencyKey();

      const orderPayload: any = {
        shippingAddress,
        phoneNumber,
        addressId: selectedAddressId,
        paymentMethod,
        items: itemsPayload,
        couponCode: couponResult?.code,
        transferProof:
          paymentMethod === "BANKAK" ? transferImage : undefined,
        paymentProofUrl:
          paymentMethod === "BANKAK" ? transferImage : undefined,
        idempotencyKey,
      };

      const order = await createOrder(orderPayload);
      const orderId = order?._id || order?.id || null;
      if (!orderId) throw new Error("ORDER_CREATE_NO_ID");

      // Order confirmed — invalidate the idempotency key.
      idempotencyKeyRef.current = null;

      itemsPayload.forEach((it: any) => {
        trackEvent("purchase", {
          productId: it?.productId,
          orderId,
          screen: "checkout",
          price: it?.unitPrice ?? 0,
          quantity: it?.quantity ?? 1,
          paymentMethod,
        });
      });

      try {
        await clearCart();
      } catch (clearErr) {
        if (__DEV__) console.warn("clearCart after order failed", clearErr);
      }
      handleClose();
      toast.success(i18n.t("orderSuccess") || "Order placed");
      router.push({
        pathname: "/order-success",
        params: { orderId, orderNumber: order?.orderNumber },
      });
    } catch (e: any) {
      const classified = classifyError(e);
      toast.error(classified.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isCheckoutEnabled,
    checkoutDisabledReason,
    selectedAddressId,
    paymentMethod,
    transferImage,
    getToken,
    addresses,
    runQuote,
    itemsPayload,
    couponResult?.code,
    createOrder,
    clearCart,
    handleClose,
    trackEvent,
    router,
  ]);

  const selectedAddress = useMemo(
    () =>
      (addresses || []).find(
        (a: any) => String(a._id) === String(selectedAddressId),
      ),
    [addresses, selectedAddressId],
  );

  const addressCaption = selectedAddress
    ? [
        selectedAddress.subCityName || selectedAddress.area,
        selectedAddress.cityName || selectedAddress.city,
      ]
        .filter(Boolean)
        .join(" · ")
    : i18n.t("addressForm_addTitle") || "Add a shipping address";

  const paymentCaption = paymentMethod
    ? paymentMethod === "CASH"
      ? i18n.t("cashPayment") || "Cash on delivery"
      : i18n.t("bankakPayment") || "Bank transfer (Bankak)"
    : i18n.t("selectPaymentMethod") || "Choose how you'd like to pay";

  const showAddressForm$ = showAddressForm;

  // Address form takes the full screen when adding/editing.
  if (showAddressForm$) {
    return (
      <AddressForm
        visible={showAddressForm$}
        onClose={() => setShowAddressForm(false)}
        onSubmit={handleAddAddress}
        initialValues={addressFormInitial as any}
      />
    );
  }

  // Initial address loading.
  if (isAddressesLoading && !addresses?.length) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: t.surface,
            paddingTop: insets.top + spacing.sm,
          },
        ]}
      >
        <CheckoutHeader onClose={handleClose} />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.skeletonCard,
                { backgroundColor: t.card, borderColor: t.border },
              ]}
            >
              <Skeleton width="55%" height={16} />
              <View style={{ height: 8 }} />
              <Skeleton width="80%" height={12} />
              <View style={{ height: 6 }} />
              <Skeleton width="40%" height={12} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: t.surface,
            paddingTop: insets.top + spacing.sm,
          },
        ]}
      >
        <CheckoutHeader onClose={handleClose} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — Delivery address */}
          <CheckoutSection
            step={1}
            title={i18n.t("deliveryAddress") || "Delivery address"}
            caption={addressCaption}
            collapsible
            open={openSections.address}
            onToggle={v => setSection("address", v)}
            complete={!!selectedAddress?.phone}
          >
            {addresses && addresses.length > 0 ? (
              <View>
                {addresses.map((addr: any) => (
                  <AddressCard
                    key={String(addr._id)}
                    address={addr}
                    selected={
                      String(selectedAddressId) === String(addr._id)
                    }
                    onSelect={id => setSelectedAddressId(id)}
                  />
                ))}
                <PressableScale
                  onPress={() => {
                    setAddressFormInitial(null);
                    setShowAddressForm(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    i18n.t("addNewAddress") || "Add new address"
                  }
                  style={[
                    styles.addAddressBtn,
                    { borderColor: t.border, backgroundColor: t.card },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={t.accent}
                  />
                  <RNText
                    style={[
                      styles.addAddressText,
                      { color: t.accent },
                    ]}
                  >
                    {i18n.t("addNewAddress") || "Add new address"}
                  </RNText>
                </PressableScale>
              </View>
            ) : (
              <View style={styles.emptyAddress}>
                <Text
                  style={[styles.emptyText, { color: t.textTertiary }]}
                >
                  {i18n.t("noAddressesYet") ||
                    "You haven't added an address yet."}
                </Text>
                <PressableScale
                  onPress={() => {
                    setAddressFormInitial(null);
                    setShowAddressForm(true);
                  }}
                  accessibilityRole="button"
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: t.cta },
                  ]}
                >
                  <RNText
                    style={[styles.primaryBtnText, { color: t.ctaText }]}
                  >
                    {i18n.t("addNewAddress") || "Add address"}
                  </RNText>
                </PressableScale>
              </View>
            )}
          </CheckoutSection>

          {/* Step 2 — Delivery method */}
          <CheckoutSection
            step={2}
            title={i18n.t("deliveryMethod") || "Delivery method"}
            collapsible
            open={openSections.delivery}
            onToggle={v => setSection("delivery", v)}
            complete={!!selectedAddressId}
          >
            <ShippingMethodCard
              shippingFee={pricing.shippingFee}
              loading={quoteLoading}
              format={formatAmount}
            />
          </CheckoutSection>

          {/* Step 3 — Payment */}
          <CheckoutSection
            step={3}
            title={i18n.t("paymentMethod") || "Payment method"}
            caption={paymentCaption}
            collapsible
            open={openSections.payment}
            onToggle={v => setSection("payment", v)}
            complete={
              !!paymentMethod &&
              (paymentMethod === "CASH" ||
                (paymentMethod === "BANKAK" &&
                  !!transferImage &&
                  String(transferImage).startsWith("http")))
            }
          >
            {currentTotal >= PROOF_THRESHOLD ? (
              <View style={{ marginBottom: spacing.md }}>
                <InlineAlert
                  tone="info"
                  message={
                    `${i18n.t("bankakPaymentWarning") || "Cash on delivery is unavailable above"} ${formatPrice(PROOF_THRESHOLD)}.`
                  }
                />
              </View>
            ) : null}

            <PaymentCard
              title={i18n.t("cashPayment") || "Cash on delivery"}
              description={
                i18n.t("cashPaymentDescription") ||
                "Pay with cash when your order arrives."
              }
              icon="cash-outline"
              selected={paymentMethod === "CASH"}
              disabled={currentTotal >= PROOF_THRESHOLD}
              onSelect={() => {
                setPaymentMethod("CASH");
                setTransferImage(null);
              }}
            />

            <PaymentCard
              title={i18n.t("bankakPayment") || "Bank transfer (Bankak)"}
              description={
                i18n.t("bankakPaymentDescription") ||
                "Transfer the order amount and upload your receipt to confirm."
              }
              icon="card-outline"
              selected={paymentMethod === "BANKAK"}
              onSelect={() => setPaymentMethod("BANKAK")}
              expanded={
                <BankTransferDetails
                  config={bankTransferConfig}
                  imageUri={transferImage}
                  uploading={uploadingImage}
                  uploaded={
                    !!transferImage &&
                    String(transferImage).startsWith("http")
                  }
                  onPick={pickImage}
                  onRemove={() => setTransferImage(null)}
                />
              }
            />

            <View
              style={[
                styles.secureRow,
                { backgroundColor: t.surfaceMuted },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={t.textTertiary}
              />
              <Text
                style={[styles.secureText, { color: t.textTertiary }]}
              >
                {i18n.t("checkout_secureNote") ||
                  "Your payment information is encrypted and secure."}
              </Text>
            </View>
          </CheckoutSection>

          {/* Step 4 — Promo */}
          <CheckoutSection
            step={4}
            title={i18n.t("promoCode") || "Promo code"}
            caption={
              couponResult?.valid
                ? `${couponResult.code} · ${formatAmount(couponResult.discountAmount)} ${i18n.t("off") || "off"}`
                : i18n.t("optional") || "Optional"
            }
            collapsible
            open={openSections.promo}
            onToggle={v => setSection("promo", v)}
            complete={!!couponResult?.valid}
          >
            <CouponField
              products={(cart?.products ?? []).map((it: any) => ({
                productId: it.product._id,
                categoryId: it.product.category,
              }))}
              userId={user?.id}
              orderAmount={orderAmount}
              orderAmountBase={orderAmountBase}
              applied={couponResult}
              format={formatAmount}
              onApply={setCouponResult}
              onRemove={() => setCouponResult(null)}
            />
          </CheckoutSection>

          {/* Step 5 — Order items */}
          {itemsPayload.length > 0 && (cart?.products?.length ?? 0) > 0 ? (
            <CheckoutSection
              step={5}
              title={i18n.t("orderItems") || "Order items"}
              caption={`${itemCount} ${itemCount === 1 ? i18n.t("item") || "item" : i18n.t("items") || "items"}`}
              collapsible
              defaultOpen={false}
            >
              <OrderItemsCard items={(cart?.products ?? []) as any} />
            </CheckoutSection>
          ) : null}

          {/* Step 6 — Order summary */}
          <CheckoutSection
            step={6}
            title={i18n.t("orderSummary") || "Order summary"}
            collapsible={false}
          >
            {hasInvalidItems ? (
              <View style={{ marginBottom: spacing.md }}>
                <InlineAlert
                  tone="error"
                  title={
                    i18n.t("unavailableItemsTitle") ||
                    "Some items can't be ordered"
                  }
                  message={
                    invalidItems.map(it => `• ${it.name}`).join("\n") ||
                    i18n.t("unavailableItemsHelp") ||
                    "Remove these items from your cart to continue."
                  }
                />
              </View>
            ) : null}

            <PriceBreakdown
              pricing={pricing}
              itemCount={itemCount}
              format={formatAmount}
              couponLabel={couponResult?.code}
              estimatedDelivery={
                i18n.t("estimatedDeliveryEta") ||
                "Estimated 2–4 business days"
              }
            />
          </CheckoutSection>

          <View style={{ height: spacing.lg }} />
        </ScrollView>

        <CheckoutFooter
          total={pricing.total}
          currency={cartCurrency}
          loading={isSubmitting || uploadingImage}
          disabled={!isCheckoutEnabled}
          onPress={handleCheckout}
          itemCount={itemCount}
          ctaLabel={i18n.t("placeOrder") || "Place order"}
          caption={i18n.t("orderTotal") || "Order total"}
          hint={!isCheckoutEnabled ? checkoutDisabledReason : null}
          variant="checkout"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },

  skeletonCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    marginBottom: spacing.md,
  },

  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    marginTop: spacing.xs,
  },
  addAddressText: {
    ...typography.bodyStrong,
    fontFamily: Platform.OS === "web" ? undefined : "Cairo-Bold",
  },

  emptyAddress: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  emptyText: { ...typography.body, textAlign: "center" },

  primaryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    ...typography.bodyStrong,
    fontFamily: Platform.OS === "web" ? undefined : "Cairo-Bold",
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    marginTop: spacing.sm,
  },
  secureText: { ...typography.caption, flex: 1 },
});
