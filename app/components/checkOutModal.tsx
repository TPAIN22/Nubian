import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useOrderStore } from "@/store/orderStore";
import { useAuth } from "@clerk/clerk-expo";
import { useCartStore } from "@/store/useCartStore";

export default function CheckOutModal({
  handleClose,
}: {
  handleClose: () => void;
}) {
  const [selectedCity, setSelectedCity] = useState("");
  const [showCityModal, setShowCityModal] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { createOrder } = useOrderStore();
  const { getToken } = useAuth();
  const {clearCart} = useCartStore();


  const cities = ["الخرطوم", "مدني", "القضارف", "بورتسودان", "عطبرة"];

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setShowCityModal(false);
  };

  const validateForm = () => {
    if (!selectedCity.trim()) {
      Alert.alert("خطأ", "يرجى اختيار المدينة");
      return false;
    }
    if (!address.trim()) {
      Alert.alert("خطأ", "يرجى إدخال العنوان");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("خطأ", "يرجى إدخال رقم الهاتف");
      return false;
    }
    if (phone.length < 10) {
      Alert.alert("خطأ", "رقم الهاتف غير صحيح");
      return false;
    }
    return true;
  };

  const handlePressCheckout = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      const deliveryAddress = {
        city: selectedCity,
        address: address.trim(),
        phone: phone.trim(),
      };

      if (token) {
        await createOrder(token, deliveryAddress);
        await clearCart();
        Alert.alert("نجح", "تم تأكيد الطلب بنجاح!");
        handleClose();
      } else {
        Alert.alert("خطأ", "حدث خطأ في المصادقة");
      }
    } catch (error) {
      console.log(error);

      Alert.alert("خطأ", "حدث خطأ أثناء إرسال الطلب");
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>العنوان والتوصيل</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>المدينة *</Text>
            <TouchableOpacity
              style={[styles.citySelector, selectedCity && styles.filledInput]}
              onPress={() => setShowCityModal(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.citySelectorText,
                  !selectedCity && styles.placeholder,
                ]}
              >
                {selectedCity || "اختر المدينة"}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>العنوان *</Text>
            <TextInput
              style={[styles.input, address && styles.filledInput]}
              placeholder="ادخل اسم المحلية والحي"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>رقم الهاتف *</Text>
            <TextInput
              style={[styles.input, phone && styles.filledInput]}
              value={phone}
              onChangeText={setPhone}
              placeholder="ادخل رقم الهاتف"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handlePressCheckout}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "جاري التأكيد..." : "تأكيد الطلب"}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showCityModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCityModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCityModal(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>اختر المدينة</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCityModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={cities}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.cityOption,
                      selectedCity === item && styles.selectedCityOption,
                    ]}
                    onPress={() => selectCity(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cityOptionText,
                        selectedCity === item && styles.selectedCityOptionText,
                      ]}
                    >
                      {item}
                    </Text>
                    {selectedCity === item && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </KeyboardAwareScrollView>
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
    textAlign: "right",
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
    textAlign: "right",
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
    textAlign: "right",
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
    textAlign: "right",
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
});
