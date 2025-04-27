import React from 'react';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
const iconSize = 24;
const focusedColor = '#4d4617';
const unfocusedColor = '#A37E2C';
const backgroundColorFocused = 'rgba(163, 126, 44, 0.2)'; // primary/20
import  Ionicons  from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';



// Design constants
const CustomHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(3);

  return (
    <SafeAreaView style={styles.headerContainer}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <ExpoImage 
          source={require('../../assets/images/icon.png')}
          contentPosition="top"
          style={styles.logo}
          contentFit="contain"
        />
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        {/* Notification Icon */}
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#4d4617" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function TabLayout() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        headerShown: true,
        tabBarActiveTintColor: focusedColor,
        tabBarInactiveTintColor: unfocusedColor,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -4,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          margin: 6,
          height: 48,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      
      
      <Tabs.Screen
        name="search"  // Changed from 'explore' to 'search'
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: focusedColor,
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={focused ? 'cart' : 'cart-outline'}
                size={iconSize}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: -10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 20,
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    marginLeft: -10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});















// const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
//   <View
//     style={{

//       marginTop: 8,
//       padding: 16,
//       borderRadius: 100,
//       backgroundColor: focused ? backgroundColorFocused : 'transparent',
//     }}
//   >
//     <Image
//       source={source}
//       style={{
//         width: iconSize,
//         height: iconSize,
//         tintColor: focused ? focusedColor : unfocusedColor,
//       }}
//       contentFit="contain"
//     />
//   </View>
// );

// export default function _layout() {
//   return (
//     <Tabs
//       screenOptions={{
//         tabBarShowLabel: false,
//         headerShown: false,
//         tabBarStyle: {
//           position: 'absolute',
//           left: 5,
//           right: 5,
//           bottom: 10,
//           elevation: 0,
//           marginHorizontal: 30,
//           backgroundColor: '#E6E2E2FF',
//           borderRadius: 25,
//           height: 60,
//           paddingTop: 5,
//         },        
//       }}
//     >
//        <Tabs.Screen
//         name="cart"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               source={require('../../assets/images/cart-shopping-solid.svg')}
//               focused={focused}
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="home"
//         options={{
//           tabBarHideOnKeyboard: true,
//           headerSearchBarOptions: {
//           placeholder: 'Search',
          
//           },
//           headerRight: () => (
//             <Image
//               source={require('../../assets/images/cart-shopping-solid.svg')}
//               style={{ width: 20, height: 20  ,marginRight: 10 , tintColor: '#A37E2C'}}
//             />
//           ),
//           headerShown: true,
//           headerTitle: 'Nubian',
//           headerTintColor: '#A37E2C',
//           headerLeft: () => (
//             <Image
//               source={require('../../assets/images/icon.png')}
//               style={{ width: 50, height: 50 ,top: 3}}
//             />
//           ),
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               source={require('../../assets/images/house-solid.svg')}
//               focused={focused}
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           tabBarIcon: ({ focused }) => (
//             <TabIcon
//               source={require('../../assets/images/user-solid.svg')}
//               focused={focused}
//             />
//           ),
//         }}
//       />
     
//     </Tabs>
//   );
// }