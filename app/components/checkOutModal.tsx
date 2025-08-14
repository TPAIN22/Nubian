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
} from "react-native";
import useOrderStore from "@/store/orderStore";
import CouponInput, { CouponValidationResult } from "./CouponInput";
import { useAuth } from "@clerk/clerk-expo";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/addressStore";
import AddressForm, { Address } from "./AddressForm";
import { useUser } from "@clerk/clerk-expo";

export default function CheckOutModal({
  handleClose,
}: {
  handleClose: () => void;
}) {
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
  const [couponResult, setCouponResult] =
    useState<CouponValidationResult | null>(null);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormInitial, setAddressFormInitial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert("خطأ", "يرجى اختيار عنوان للتوصيل");
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
        paymentMethod: "cash",
        ...(couponResult && couponResult.valid
          ? { couponCode: couponResult.code }
          : {}),
      };
      if (token) {
        await createOrder(orderPayload, token);
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
        color="#f0b745"
        style={{ marginTop: 40 }}
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
          <Text style={styles.addButtonText}>+ إضافة عنوان جديد</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>اختر عنوان التوصيل</Text>
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
              <Text>
                {item.city}، {item.area}، {item.street}، {item.building}
              </Text>
              <Text>📞 {item.phone}</Text>
              {item.notes ? <Text>ملاحظات إضافية: {item.notes}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>لا توجد عناوين محفوظة</Text>
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
        {/* مكون الكوبون */}
        <CouponInput
          products={cart.products.map((item: any) => ({
            productId: item.product._id,
            categoryId: item.product.category,
          }))}
          userId={user?.id || ""}
          onValidate={setCouponResult}
        />
        {/* عرض الخصم والمجموع النهائي */}
        {couponResult && couponResult.valid && (
          <View style={{ alignItems: "center", marginVertical: 8 }}>
            <Text style={{ color: "green", fontWeight: "bold" }}>
              خصم: {couponResult.discountValue}{" "}
              {couponResult.discountType === "percentage" ? "%" : "ج.س"}
            </Text>
            <Text style={{ color: "#2c3e50", fontWeight: "bold" }}>
              المجموع بعد الخصم:{" "}
              {Math.max(
                0,
                cart.totalPrice -
                  (couponResult.discountType === "percentage"
                    ? (cart.totalPrice * couponResult.discountValue) / 100
                    : couponResult.discountValue)
              )}{" "}
              ج.س
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCheckout}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "جاري التأكيد..." : "تأكيد الطلب"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9fa",
    width: "100%",
  },
  innerContainer: {
    padding: 20,
    paddingBottom: 50,
    width: "100%",
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  citySelector: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  citySelectorText: {
    fontSize: 16,
    color: "#2c3e50",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    color: "#999",
  },
  arrow: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
    textAlign: "left",
    color: "#2c3e50",
  },
  filledInput: {
    borderColor: "#f0b745",
    borderWidth: 2,
  },
  button: {
    backgroundColor: "#f0b745",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 0,
    width: "85%",
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "bold",
  },
  cityOption: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedCityOption: {
    backgroundColor: "#e3f2fd",
  },
  cityOptionText: {
    fontSize: 14,
    color: "#2c3e50",
    textAlign: "left",
    flex: 1,
  },
  selectedCityOptionText: {
    color: "#f0b745",
    fontWeight: "600",
  },
  checkMark: {
    fontSize: 14,
    color: "#f0b745",
    fontWeight: "bold",
  },
  addressCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedCard: {
    borderColor: "#f0b745",
    borderWidth: 2,
    backgroundColor: "#e3f7fa",
  },
  addressName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 6,
  },
  defaultText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#f0b745",
    borderWidth: 0.5,
    borderColor: "#f0b745",
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 200,
    color: "#f0b745",
  },
});
