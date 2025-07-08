import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import useOrderStore from "@/store/orderStore";
import { useAuth } from "@clerk/clerk-expo";
import useCartStore from "@/store/useCartStore";
import useAddressStore from "@/store/addressStore";
import AddressForm, { Address } from "./AddressForm";

export default function CheckOutModal({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const { addresses, fetchAddresses, addAddress, isLoading: isAddressesLoading } = useAddressStore();
  const { getToken } = useAuth();
  const { createOrder } = useOrderStore();
  const { clearCart } = useCartStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormInitial, setAddressFormInitial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getToken().then(token => fetchAddresses(token));
  }, []);

  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find((a: Address) => a.isDefault) || addresses[0];
      setSelectedAddressId(def && def._id ? def._id! : null);
    }
  }, [addresses.length]);

  const handleAddAddress = async (form: Omit<Address, '_id'>) => {
    const token = await getToken();
    console.log('Submitting new address:', form);
    try {
      await addAddress(form, token);
      console.log('Address added, fetching addresses...');
      await fetchAddresses(token);
      setShowAddressForm(false);
      setTimeout(() => {
        const latest = addresses.find((a: Address) => a.isDefault) || addresses[addresses.length - 1];
        setSelectedAddressId(latest && latest._id ? latest._id : null);
      }, 300);
      Alert.alert('تمت الإضافة', 'تم إضافة العنوان بنجاح');
    } catch (err) {
      console.log('Error adding address:', err);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة العنوان');
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
      const selectedAddress = addresses.find((a: Address) => a._id === selectedAddressId);
      if (!selectedAddress) throw new Error("العنوان غير موجود");
      const orderPayload = {
        deliveryAddress: selectedAddress,
        paymentMethod: "cash",
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

  if (isAddressesLoading) return <ActivityIndicator size="large" color="#30a1a7" style={{ marginTop: 40 }} />;
  if (showAddressForm) {
    return (
      <AddressForm
        visible={true}
        onClose={() => {
          setShowAddressForm(false);
          Alert.alert('تم الإلغاء', 'لم يتم إضافة أي عنوان');
        }}
        onSubmit={handleAddAddress}
        initialValues={addressFormInitial}
      />
    );
  }

  if (addresses.length === 0) {
    return (
      <View style={[styles.innerContainer, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}> 
        <Text style={styles.emptyText}>لا توجد عناوين محفوظة</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setAddressFormInitial(null); setShowAddressForm(true); }}>
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
              style={[styles.addressCard, selectedAddressId === item._id && styles.selectedCard]}
              onPress={() => setSelectedAddressId(item._id || null)}
            >
              <Text style={styles.addressName}>{item.name} {item.isDefault && <Text style={styles.defaultText}>(افتراضي)</Text>}</Text>
              <Text>{item.city}، {item.area}، {item.street}، {item.building}</Text>
              <Text>📞 {item.phone}</Text>
              {item.notes ? <Text>ملاحظات إضافية: {item.notes}</Text> : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد عناوين محفوظة</Text>}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => { setAddressFormInitial(null); setShowAddressForm(true); }}>
          <Text style={styles.addButtonText}>+ إضافة عنوان جديد</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCheckout}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{isLoading ? "جاري التأكيد..." : "تأكيد الطلب"}</Text>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filledInput: {
    borderColor: "#30a1a7",
    borderWidth: 2,
  },
  button: {
    backgroundColor: "#30a1a7",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#30a1a7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
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
    fontSize: 18,
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
    paddingVertical: 16,
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
    fontSize: 16,
    color: "#2c3e50",
    textAlign: "left",
    flex: 1,
  },
  selectedCityOptionText: {
    color: "#30a1a7",
    fontWeight: "600",
  },
  checkMark: {
    fontSize: 18,
    color: "#30a1a7",
    fontWeight: "bold",
  },
  addressCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedCard: {
    borderColor: '#30a1a7',
    borderWidth: 2,
    backgroundColor: '#e3f7fa',
  },
  addressName: {
    fontSize: 16,
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
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#30a1a7",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#30a1a7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
