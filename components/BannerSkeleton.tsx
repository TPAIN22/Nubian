// components/BannerSkeleton.tsx
import { View, StyleSheet, Dimensions } from "react-native";
import { Skeleton } from "moti/skeleton";
import { useTheme } from "@/providers/ThemeProvider";

const { width } = Dimensions.get("window");

export default function BannerSkeleton() {
  const { theme } = useTheme();
  const colorMode = theme.mode === 'dark' ? 'dark' : 'light';
  
  return (
    <View style={styles.container}>
      <Skeleton 
        height={250} 
        width={width} 
        radius={0} 
        colorMode={colorMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 250,
    overflow: "hidden",
  },
});
