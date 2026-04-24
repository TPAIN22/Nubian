import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScrollStore } from "@/store/useScrollStore";
import { useTheme } from "@/providers/ThemeProvider";
import { HomeCategory } from "@/api/home.api";
import { useCartQuantity } from '../../store/useCartStore';

interface HomeHeaderProps {
  activeTab?: string;
  onTabPress?: (tab: string) => void;
  categories?: HomeCategory[];
}



export const HomeHeader = memo(({ activeTab = "All", onTabPress, categories = [] }: HomeHeaderProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isScrolled = useScrollStore((state) => state.isScrolled);
  const { theme } = useTheme();
  const cartQuantity = useCartQuantity();
  const headerBg = isScrolled ? theme.colors.surface : "transparent";
  const iconColor = isScrolled ? theme.colors.text.gray : "#FFF";
  const activeIconColor = isScrolled ? theme.colors.primary : "#FFF";
  const searchBg = isScrolled ? (theme.mode === 'dark' ? '#2A2A2A' : '#F5F5F5') : "#FFF";
  const textColor = isScrolled ? theme.colors.text.gray : "rgba(255, 255, 255, 0.9)";
  const activeTextColor = isScrolled ? theme.colors.text.primary : "#FFF";
  const underlineColor = isScrolled ? theme.colors.primary : "#FFF";

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 30), backgroundColor: headerBg }]}>
      {/* Top Navigation Row */}
      <View style={styles.topRow}>
        <View style={styles.leftIcons}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(screens)/notification')}>
            <Ionicons name="notifications-outline" size={24} color={iconColor} />
            {/* Optional Unread Badge: <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View> */}
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="bag-outline" size={24} color={iconColor} />
            {cartQuantity > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartQuantity > 99 ? '99+' : cartQuantity}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Pressable
          style={[styles.searchBar, { backgroundColor: searchBg }]}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <View style={styles.searchIcons}>
            <Ionicons name="search-outline" size={20} color="#000" />
          </View>
        </Pressable>

        <View style={styles.rightIcons}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/(tabs)/wishlist')}>
            <Ionicons name="heart-outline" size={26} color={iconColor} />
          </Pressable>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {(() => {
            const tabsToRender = [{ _id: 'all', name: 'All' }, ...categories];

            return tabsToRender.map((tab) => {
              const tabId = tab._id;
              const tabName = tab.name;
              const isActive = tabId === activeTab || tabName === activeTab;

              return (
                <Pressable
                  key={tabId}
                  style={[
                    styles.tabBtn,
                    isActive && styles.tabBtnActive,
                    isActive && { borderBottomColor: underlineColor }
                  ]}
                  onPress={() => onTabPress?.(tabId)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: textColor },
                      isActive && styles.tabTextActive,
                      isActive && { color: activeTextColor }
                    ]}
                  >
                    {tabName}
                  </Text>
                </Pressable>
              );
            });
          })()}
        </ScrollView>
      </View>
    </View>
  );
});
HomeHeader.displayName = 'HomeHeader';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 8,

  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 20,
  },
  leftIcons: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 10,
  },
  rightIcons: {
    marginLeft: 10,
  },
  iconBtn: {
    position: 'relative',
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: 'red',
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  searchBar: {
    flex: 1,
    height: 36,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'flex-end',
  },
  searchText: {
    fontSize: 13,
  },
  searchIcons: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  tabsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 20,
    paddingRight: 50,
  },
  tabBtn: {
    paddingBottom: 4,
  },
  tabBtnActive: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
});
