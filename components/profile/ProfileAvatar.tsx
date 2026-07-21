import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/providers/ThemeProvider";

interface ProfileAvatarProps {
  imageUrl?: string | null;
  initials: string;
  size?: number;
}

/**
 * Circular avatar with a soft gold ring. Falls back to the user's initials on a
 * tinted fill when no image is available.
 */
export function ProfileAvatar({
  imageUrl,
  initials,
  size = 68,
}: ProfileAvatarProps) {
  const { theme } = useTheme();
  const gold = theme.colors.primary;

  const ring = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderColor: gold + "33",
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatar, ring]}
        contentFit="cover"
        transition={200}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      style={[styles.avatar, styles.fallback, ring, { backgroundColor: gold + "1A" }]}
    >
      <Text style={[styles.initials, { color: gold, fontSize: size * 0.34 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 2,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
  },
});
