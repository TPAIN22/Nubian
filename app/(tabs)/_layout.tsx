import React from 'react';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { View } from 'react-native';
const iconSize = 24;
const focusedColor = '#4d4617';
const unfocusedColor = '#A37E2C';
const backgroundColorFocused = 'rgba(163, 126, 44, 0.2)'; // primary/20

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <View
    style={{

      marginTop: 8,
      padding: 16,
      borderRadius: 100,
      backgroundColor: focused ? backgroundColorFocused : 'transparent',
    }}
  >
    <Image
      source={source}
      style={{
        width: iconSize,
        height: iconSize,
        tintColor: focused ? focusedColor : unfocusedColor,
      }}
      contentFit="contain"
    />
  </View>
);

export default function _layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 5,
          right: 5,
          bottom: 10,
          elevation: 0,
          marginHorizontal: 30,
          backgroundColor: '#E6E2E2FF',
          borderRadius: 25,
          height: 60,
          paddingTop: 5,
        },        
      }}
    >
       <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/images/cart-shopping-solid.svg')}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarHideOnKeyboard: true,
          headerSearchBarOptions: {
          placeholder: 'Search',
          
          },
          headerRight: () => (
            <Image
              source={require('../../assets/images/cart-shopping-solid.svg')}
              style={{ width: 20, height: 20  ,marginRight: 10 , tintColor: '#A37E2C'}}
            />
          ),
          headerShown: true,
          headerTitle: 'Nubian',
          headerTintColor: '#A37E2C',
          headerLeft: () => (
            <Image
              source={require('../../assets/images/icon.png')}
              style={{ width: 50, height: 50 ,top: 3}}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/images/house-solid.svg')}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../../assets/images/user-solid.svg')}
              focused={focused}
            />
          ),
        }}
      />
     
    </Tabs>
  );
}
