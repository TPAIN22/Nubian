import { memo } from "react";
import { View, ScrollView, Pressable, StyleSheet, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";

interface SubCategoryTabsProps {
  colors: any;
  onTabPress?: (tab: string) => void;
  activeTab?: string;
}

const TABS = ["Trending", "Flash Deals", "New Arrivals", "For You", "Stores"];

export const SubCategoryTabs = memo(({ colors, onTabPress, activeTab = TABS[0] }: SubCategoryTabsProps) => {
  const isRTL = I18nManager.isRTL;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={styles.tab}
              onPress={() => onTabPress?.(tab)}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: isActive ? "#000" : colors.text.gray },
                  isActive && styles.tabTextActive
                ]}
              >
                {tab}
              </Text>
              {isActive && <View style={styles.activeLine} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});
SubCategoryTabs.displayName = "SubCategoryTabs";

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    position: "relative",
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    fontWeight: "bold",
  },
  activeLine: {
    position: "absolute",
    bottom: 0,
    width: "70%",
    height: 3,
    backgroundColor: "#000",
    borderRadius: 1.5,
  },
});
