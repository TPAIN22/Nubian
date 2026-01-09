import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useEffect, useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { useContext } from 'react';
import { LanguageContext } from '@/utils/LanguageContext';
import useCartStore from "@/store/useCartStore";
import CartBadge from "./CartBadge";
import Colors from "@/locales/brandColors";
import { useScrollStore } from "@/store/useScrollStore";
import { useTheme } from "@/providers/ThemeProvider";

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function HeaderComponent() {
  const { language, setLanguage } = useContext(LanguageContext);
  const router = useRouter();
  const { fetchCart } = useCartStore();
  const { theme } = useTheme();
  const Colors = theme.colors;
  
  // Get scroll position from store - this will cause re-render when scroll changes
  const currentScrollY = useScrollStore((state) => state.scrollY);
  
  // Threshold for when header becomes opaque
  const SCROLL_THRESHOLD = 10;

  // جلب بيانات السلة عند تحميل المكون
  useEffect(() => {
    const loadCart = async () => {
      try {
        await fetchCart();
      } catch (error) {
        console.log('Error loading cart:', error);
      }
    };

    loadCart();
  }, []);

  // Header should be transparent at top, opaque when scrolling down
  // Memoize to prevent unnecessary recalculations
  const headerStyle = useMemo(() => {
    const isScrolled = currentScrollY > SCROLL_THRESHOLD;
    
    return {
      backgroundColor: isScrolled ? Colors.cardBackground : 'transparent',
      borderColor: isScrolled ? Colors.borderLight : 'transparent',
      shadowOpacity: isScrolled ? 0.15 : 0,
      isScrolled,
    };
  }, [currentScrollY, Colors.cardBackground, Colors.borderLight]);

  return (
    <View 
      style={[
        styles.headerContainer,
        {
          backgroundColor: headerStyle.backgroundColor,
          ...Platform.select({
            ios: {
              shadowOpacity: headerStyle.shadowOpacity,
            },
          }),
        }
      ]}
    >
      <StatusBar 
        barStyle={headerStyle.isScrolled ? (theme.mode === 'dark' ? 'light-content' : 'dark-content') : "light-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      <View 
        style={[
          styles.header,
          {
            borderBottomWidth: headerStyle.isScrolled ? 1 : 0,
            borderBottomColor: headerStyle.borderColor,
          }
        ]}
      >
        {/* Logo Section */}
        <TouchableOpacity 
          style={styles.logoSection}
          onPress={() => router.push("/(tabs)/index")}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../assets/images/nubianLogo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </TouchableOpacity>

        {/* Search Bar - Prominent & Elegant */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: headerStyle.isScrolled 
                ? Colors.cardBackground 
                : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)'),
              borderColor: headerStyle.isScrolled 
                ? Colors.borderLight 
                : (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(163, 126, 44, 0.4)'),
              borderWidth: 1.5,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.searchBarInner}
            onPress={() => router.push("/(tabs)/explor")}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={headerStyle.isScrolled ? Colors.primary : Colors.text.white} 
            />
            <Text 
              style={[
                styles.searchPlaceholder,
                { color: headerStyle.isScrolled ? Colors.text.secondary : Colors.text.white }
              ]} 
              numberOfLines={1}
            >
              {i18n.t('searchPlaceholder') || 'Search products...'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Icons */}
        <View style={styles.actionIcons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              headerStyle.isScrolled && styles.iconButtonActive
            ]}
            onPress={() => setLanguage(language.startsWith('ar') ? 'en' : 'ar')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="globe-outline" 
              size={22} 
              color={headerStyle.isScrolled ? Colors.primary : Colors.text.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              headerStyle.isScrolled && styles.iconButtonActive
            ]}
            onPress={() => router.push("/(screens)/notification")}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="notifications-outline" 
              size={22} 
              color={headerStyle.isScrolled ? Colors.primary : Colors.text.white} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconButton,
              styles.cartButton,
              headerStyle.isScrolled && styles.iconButtonActive
            ]}
            onPress={() => router.push("/(tabs)/cart")}
            activeOpacity={0.7}
          >
            <View style={styles.cartContainer}>
              <Ionicons 
                name="bag-outline" 
                size={22} 
                color={headerStyle.isScrolled ? Colors.primary : Colors.text.white} 
              />
              <CartBadge size={16} fontSize={8} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: STATUS_BAR_HEIGHT,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  logoSection: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 32,
    height: 32,
  },
  searchBar: {
    flex: 1,
    height: 42,
    borderRadius: 24,
    marginHorizontal: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary + '20',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        shadowOpacity: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
    width: '100%',
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(163, 126, 44, 0.15)',
  },
  cartButton: {
    marginLeft: 2,
  },
  cartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
});