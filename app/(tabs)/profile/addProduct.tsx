import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import React, { useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";

export default function AddProduct() {
  const navigation = useNavigation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: "none" },
      });

      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: undefined,
        });
      };
    }, [])
  );

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.5,
      base64: false,
      legacy: true,
    });

    if (!result.canceled && result.assets?.length) {
      const image = result.assets[0];

      const formData = new FormData();
      formData.append("file", {
        uri: image.uri,
        type: image.mimeType || "image/jpeg",
        name: `image_${Date.now()}.jpg`,
      }as any);

      try {
        setLoading(true);
        const response = await axios.post(
          "https://nubian-auth.onrender.com/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const imageUrl = response.data.url;
        setImages((prev) => [...prev, imageUrl]);
      } catch (error) {
        Alert.alert("فشل رفع الصورة");
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const createProduct = useMutation(api.products.createProduct.createProduct);

  const handleSubmit = async () => {
    if (!name || !price || !description) {
      Alert.alert("كل الحقول مطلوبة");
      return;
    }

    if (images.length < 4) {
      Alert.alert("يجب إضافة 4 صور على الأقل");
      return;
    }

    if (isNaN(Number(price))) {
      Alert.alert("السعر غير صحيح");
      return;
    }

    try {
      setLoading(true);
      await createProduct({
        name,
        price: Number(price),
        description,
        images,
        category: "نسائي",
        inStock: true,
        ownerId: "", // استبدل هذا بـ userId إن توفر
      });

      Alert.alert("تم إرسال المنتج بنجاح");
      setImages([]);
      setName("");
      setPrice("");
      setDescription("");
      router.back();
    } catch (error) {
      Alert.alert("حدث خطأ، الرجاء المحاولة لاحقًا");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.label}>اسم المنتج</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: تيشيرت رجالي"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>السعر</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: 120"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={styles.label}>الوصف</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          multiline
          numberOfLines={4}
          placeholder="أضف وصف المنتج"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>الصور ({images.length} / 6)</Text>
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageBox}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                onPress={() => removeImage(index)}
                style={styles.removeBtn}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 6 && (
            <TouchableOpacity onPress={pickImage} style={styles.addImageBox}>
              <Ionicons name="add" size={30} color="#777" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#9B7931"
            style={{ marginTop: 30 }}
          />
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              إضافة المنتج
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F9F9F9",
  },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  imageBox: { position: "relative" },
  image: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    borderRadius: 10,
    padding: 2,
  },
  addImageBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtn: {
    backgroundColor: "#9B7931",
    marginTop: 30,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});
