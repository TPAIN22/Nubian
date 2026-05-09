import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import CheckOutModal from "@/components/checkOutModal";
import { useCheckoutTheme } from "@/components/checkout";

export default function CheckoutScreen() {
  const router = useRouter();
  const t = useCheckoutTheme();

  return (
    <BottomSheetModalProvider>
      <View style={[styles.container, { backgroundColor: t.surface }]}>
        <CheckOutModal handleClose={() => router.back()} />
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
