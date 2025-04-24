import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileOrLogin() {
  // نفترض إن فيه مستخدم أو لا
  const [user, setUser] = useState(null); // null = غير مسجل

  const handleLogin = () => {
    // محاكاة تسجيل دخول
    setUser({
      name: "مصطفى",
      email: "mustafa@example.com",
      avatar: "https://i.pravatar.cc/100", // صورة عشوائية
    });
  };

  const handleLogout = () => {
    Alert.alert("تنبيه", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء" },
      { text: "تسجيل الخروج", onPress: () => setUser(null) },
    ]);
  };

  if (!user) {
    // 👉 شاشة تسجيل الدخول
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="person-circle-outline" size={80} color="#A37E2C" />
        <Text style={styles.title}>أهلاً بك!</Text>
        <Text style={styles.subtitle}>سجل دخولك للمتابعة</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ✅ شاشة البروفايل
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileBox}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <TouchableOpacity style={[styles.button, { marginTop: 30 }]} onPress={handleLogout}>
          <Text style={styles.buttonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  profileBox: {
    alignItems: "center",
    marginTop: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#A37E2C",
  },
  email: {
    fontSize: 16,
    color: "#444",
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    color: "#A37E2C",
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#A37E2C",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
