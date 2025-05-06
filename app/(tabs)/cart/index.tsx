import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import Devider from "@/app/components/Devider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import {Image} from "expo-image";

const CartPage = () => {
  const { user } = useUser();
  const headerHight = useHeaderHeight();
  const router = useRouter();
  const cartItems = useQuery(
    api.cart.getUserCart.getUserCart,
    user ? { userId: user.id } : "skip"
  );

  const addToCart = useMutation(api.cart.addToCart.addToCart);
  const updateCartItemQuantity = useMutation(
    api.cart.updateCartItemQuantity.updateCartItemQuantity
  );
  const removeFromCart = useMutation(api.cart.removeFromCart.removeFromCart);

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      await addToCart({
        userId: user.id,
        productId,
        quantity: 1,
      });
    } catch (err) {
      console.error("فشل في الإضافة:", err);
      alert("حدث خطأ أثناء إضافة المنتج");
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
      <Image
        source={require("../../../assets/images/profilelogin.svg")}
        style={{ width: "80%", height: 300 }}
      />
      <Text>سجّل الدخول للمتابعة</Text>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/signin")}
        style={styles.loginButton}
      >
        <Text style={{ color: "#fff" }}>تسجيل الدخول</Text>
      </TouchableOpacity>
    </View>
    );
  }

  if (!cartItems) {
    return (
      <View style={styles.centered}>
        <Text>جارٍ تحميل السلة...</Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
      <Stack.Screen
        options={{

          headerLeft: () => (
            <Ionicons name="cart-outline" size={24} color="#555958FF" />
          ),
          headerTransparent: true,
          headerTitleAlign: "center",
          title: "السلة",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
        }}
      />
      <View style={{flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: headerHight}}>
        <Text className="text-2xl font-bold mb-4">لا يوجد منتجات في السلة</Text>
        <Image source={require("../../../assets/images/Nodata.svg")} style={{ width: 350, height: 200 }}/>
      </View>
      </>
    );
  }

  const handleRemoveFromCart = async (item: any) => {
    try {
      if (item.quantity > 1) {
        await updateCartItemQuantity({
          cartItemId: item._id,
          quantity: item.quantity - 1,
        });
      } else {
        await removeFromCart({
          cartItemId: item._id,
        });
      }
    } catch (err) {
      console.error("فشل في الحذف:", err);
      alert("حدث خطأ أثناء تعديل الكمية أو حذف المنتج");
    }
  };
  const handleDeleteItemCompletely = async (cartItemId:any) => {
    try {
      await removeFromCart({ cartItemId });
    } catch (err) {
      console.error("فشل في الحذف النهائي:", err);
      alert("حدث خطأ أثناء حذف المنتج نهائيًا");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Ionicons name="arrow-back" size={24} color="#555958FF" />
          ),
          headerTransparent: true,
          headerTitleAlign: "center",
          title: "السلة",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
        }}
      />
      <View style={{ marginTop: headerHight }}>
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <View style={styles.item}>
                <Image
                  source={{ uri: item.product?.images?.[0] }}
                  style={styles.image}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.product?.name}</Text>
                  <Text style={styles.price}>
                    {item.product?.price! * item.quantity} SDG
                  </Text>
                </View>
                <View className="flex flex-row items-center gap-2 px-4">
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color="#A37E2C"
                    onPress={() => handleAddToCart(item.product?._id!)}
                  />
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Ionicons
                    name="remove-circle-outline"
                    size={22}
                    onPress={() => handleRemoveFromCart(item)}
                  />
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color="red"
                    onPress={() => handleDeleteItemCompletely(item._id)}
                  />
                </View>
              </View>
              <Devider />
            </View>
          )}
        />
      </View>
      <View className="flex gap-2 flex-row items-center justify-around px-4 absolute bottom-20">
      <TouchableOpacity className="bg-[#006348] p-2 rounded-xl flex-1 items-center">
        <Text className="text-2xl font-bold text-[#eefcf8]">استمرار التسوق</Text>
      </TouchableOpacity>
      <TouchableOpacity className="bg-[#A37E2C] p-2 rounded-xl flex-1 items-center">
        <Text className="text-2xl font-bold text-[#fcfaee]">اذهب الى الدفع </Text>
      </TouchableOpacity>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  quantity: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderColor: "#A37D2C8A",
    borderWidth: 0.5,
    borderRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  image: {
    width: 70,
    height: 70,
    marginRight: 15,
    borderRadius: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  price: {
    color: "#006348",
    fontSize: 14,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
    backgroundColor: "#fff",
  },
  loginButton: {
    width: 200,
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "row",
    backgroundColor: "#9B7931DC",
    borderRadius: 15,
    padding: 10,
    marginTop: 10,
  },
});

export default CartPage;
