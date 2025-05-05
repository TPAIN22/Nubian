import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import useItemStore from "./productStore/useItemStore";
import Ionicons from "@expo/vector-icons/Ionicons";
export default function ProductDetails() {
const {item , setItem} = useItemStore();
  return (
    <>    
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Product Details",
          headerTitleStyle: { fontSize: 25, color: "#242423C5" },
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <Image source={{ uri: item?.images[1] }} style={styles.image}/>
        <Text style={styles.name}>{item.name}</Text>
      <View >
        <Text style={styles.price}>SD {item.price}</Text>
        <View>
        <Ionicons name="heart-outline" size={24} color="#A37E2C" />
        <Ionicons name="cart-outline" size={24} color="#A37E2C" />
        </View>
      </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  price: {
    color: "#A37E2C",
    fontSize: 18,
    fontWeight: "semibold",
    marginTop: 10,
    alignSelf:'flex-start',
    textAlign:'left'
  },
  image: {
    width: "100%",
    height: 260,
    borderRadius: 24,
  },
  name: {
    color: "#242423C5",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign:'right',
    alignSelf:'flex-end'
  },
});
