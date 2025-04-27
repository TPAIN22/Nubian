import React from 'react';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const iconSize = 24;
const focusedColor = '#A37E2C';
const unfocusedColor = 'black';

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <View
    style={{
      marginTop: 8,
      padding: 16,
      borderRadius: 100,
      
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
    <>
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 5,
          right: 5,
          elevation: 0,
          height: 60,
          paddingTop: 5,
        }, 
        headerStyle: {
          backgroundColor: '#A37E2C',
        }       
      }}
    >
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
              style={{ width: 20, height: 20  ,marginRight: 10}}
            />
          ),
          headerTitle: 'Nubian',
         
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
      <Tabs.Screen
        name="explor"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
            source={require('../../assets/images/search-solid.svg')}
            focused={focused}
            />
          ),
        }}
     />
    </Tabs>
    </>
  );
}
