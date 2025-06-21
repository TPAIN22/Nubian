import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useNavigation, useRouter } from "expo-router";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { Button } from "react-native";
import GoogleSignInSheet from "@/app/(auth)/signin";
export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const tabbarHeight = useBottomTabBarHeight();
  const { loaded, isSignedIn } = useClerk();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const navigation = useNavigation();
  const scrollY = useRef(0);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  const handleSheetChanges = useCallback((index: number) => {}, []);

  const settingsOptions = [
    {
      title: "تعديل الملف الشخصي",
      action: () => {
        router.push("/editProfile");
      },
      icon: "pencil" as const,
    },
    {
      title: "الاشعارات",
      action: () => {
        router.push("/notification");
      },
      icon: "notifications" as const,
    },
    { title: "الطلبات", action: () => {router.push("/order")}, icon: "file-tray" as const },
  ];
  const privacyPolicyOptions = [
    { title: "سياسة الخصوصية", action: () => ({}), icon: "eye" as const },
    { title: "الامان", action: () => ({}), icon: "lock-closed" as const },
    { title: "الدعم", action: () => ({}), icon: "" as never },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerTitle: "Settings",
      headerStyle: { backgroundColor: "transparent" },
    });
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 20 && scrollY.current <= 20) {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: "#F8F8F8",
          elevation: 0,
        },
      });
    } else if (offsetY <= 20 && scrollY.current > 20) {
      navigation.setOptions({
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
        },
      });
    }

    scrollY.current = offsetY;
  };

  useEffect(() => {
    if (loaded && isSignedIn && user) {
      setIsUserLoaded(true);
    } else {
      setIsUserLoaded(false);
    }
  }, [loaded, isSignedIn, user]);

  if (!loaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e98c22" />
      </View>
    );
  }

  if (!user) {
    return (
      <GestureHandlerRootView style={styles.loadingContainer}>
        <BottomSheetModalProvider>
          <Image
            source={require("../../assets/images/profilelogin.svg")}
            style={{ width: "80%", height: 300 }}
          />
          <Text
            style={{
              color: "#e98c22",
              fontSize: 20,
              fontWeight: "bold",
              padding: 20,
            }}
          >
            سجّل الدخول للمتابعة
          </Text>
          <TouchableOpacity
            onPress={handlePresentModalPress}
            style={styles.loginButton}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
              تسجيل الدخول
            </Text>
          </TouchableOpacity>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            onChange={handleSheetChanges}
          >
            <BottomSheetView style={styles.contentContainer}>
              <GoogleSignInSheet />
            </BottomSheetView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }

  if (isUserLoaded) {
    return (
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={30}
        style={{
          flex: 1,
          borderTopWidth: 2,
          borderTopColor: "#58492813",
          backgroundColor: "#F9F9F9FF",
        }}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: tabbarHeight + 40,
          paddingHorizontal: 20,
          borderTopColor: "#a37d2c13",
          borderTopWidth: 2,
        }}
      >
        <View className=" mb-4 h-[1px] bg-[#241d0d8b]"></View>
        <View className="flex flex-row items-center gap-4">
          <Image
            source={{ uri: user?.imageUrl }}
            style={{
              width: 70,
              height: 70,
              marginBottom: 20,
              borderRadius: 50,
              alignSelf: "auto",
            }}
          />
          <View>
            <Text className="text-2xl font-bold text-[#333333cb]">
              {"Welcome"} {user?.firstName}
            </Text>
            <Text className="text-base font-bold text-[#333333b1]">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-bold text-[#333333cb] mb-2">
          الملف الشخصي
        </Text>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={option.action}
            className="flex flex-row items-center justify-between p-4 mb-2 mt-2 rounded-lg shadow-black drop-shadow-lg bg-white w-full"
          >
            <View className="flex flex-row items-center gap-4">
              <Ionicons name={option.icon} size={16} color="#333333b1" />
              <Text className="text-base font-bold text-[#333333b1]">
                {option.title}
              </Text>
            </View>
            <Ionicons name="arrow-forward-sharp" size={16} color="#333333b1" />
          </TouchableOpacity>
        ))}

        <Text className="text-2xl font-bold text-[#333333cb] mb-2 mt-4">
          انظر ايضا
        </Text>
        {privacyPolicyOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            onPress={option.action}
            className="flex flex-row items-center justify-between p-4 mb-2 mt-2 rounded-lg shadow-black drop-shadow-lg bg-white w-full"
          >
            <View className="flex flex-row items-center gap-4">
              <Ionicons name={option.icon} size={16} color="#333333b1" />
              <Text className="text-base font-bold text-[#333333b1]">
                {option.title}
              </Text>
            </View>
            <Ionicons name="arrow-forward-sharp" size={16} color="#333333b1" />
          </TouchableOpacity>
        ))}

        <View>
          <TouchableOpacity
            onPress={() => signOut()}
            className="flex flex-row items-center justify-between p-4 mb-2 mt-2 rounded-lg shadow-black drop-shadow-lg bg-white w-full"
          >
            <Text className="text-xl text-red-500">Log out</Text>
            <Ionicons name="log-out-outline" size={26} color="#FF0202B1" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
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
    borderRadius: 35,
    padding: 10,
    marginTop: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "grey",
  },
  contentContainer: {
    flex: 1,
    padding: 36,
    alignItems: "center",
    paddingBottom: 40,
  },
});
