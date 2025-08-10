import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import i18n from "../../utils/i18n";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function onboard() {
  const deviceWidth = Math.round(Dimensions.get("window").width);
  const deviceHeight = Math.round(Dimensions.get("window").height);
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={require("../../assets/images/onboard.png")}
        style={{ width: deviceWidth, height: deviceHeight, zIndex: -1 }}
      />

      {/* Gradient background */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        style={{
          position: "absolute",
          bottom: 0,
          width: deviceWidth,
          paddingBottom: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            marginBottom: 100,
            fontSize: 30,
            fontWeight: "bold",
            textAlign: "center",
            color: "#fff",
            letterSpacing: 2,
          }}
        >
          {i18n.t("paragraph")}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: "#fff",
            padding: 15,
            paddingHorizontal: 75,
            borderRadius: 6,
          }}
          
          onPress={() => {
            router.replace("/(tabs)");
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              textAlign: "center",
              color: "#000",
              letterSpacing: 2,
            }}
          >
            {i18n.t("startShopping")}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
