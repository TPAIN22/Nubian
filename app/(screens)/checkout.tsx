import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import CheckOutModal from "../components/checkOutModal"; // عدّل المسار حسب مشروعك
import { useTheme } from "@/providers/ThemeProvider";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function CheckoutScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const Colors = theme.colors;

  return (
    <BottomSheetModalProvider>
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      <CheckOutModal handleClose={() => router.back()} />
    </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
