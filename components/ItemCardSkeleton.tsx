// components/ItemCardSkeleton.tsx
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Skeleton } from "moti/skeleton";
import { useTheme } from "@/providers/ThemeProvider";

export default function ItemCardSkeleton() {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const cardWidth = width / 2 - 8;
  const colorMode = theme.mode === 'dark' ? 'dark' : 'light';
  const Colors = theme.colors;

  return (
    <View style={[styles.card, { width: cardWidth, backgroundColor: Colors.cardBackground }]}>
      <Skeleton height={150} width={"100%"} radius={10} colorMode={colorMode} />
      <View style={{ padding: 10, paddingTop: 0 , gap:5 }}>
        <Skeleton height={14} width={"70%"} radius={4} colorMode={colorMode}/>
        <Skeleton height={12} width={60} radius={8} colorMode={colorMode}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    margin: 4,
    gap: 10,
    elevation: 2,
    overflow: "hidden",
  },
});
