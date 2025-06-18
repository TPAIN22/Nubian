import { View, Text, Pressable, StyleSheet } from 'react-native'
import React from 'react'

export default function Chekout({total , handleCheckout }:any) {
  return (
    <Pressable style={styles.button}
    onPress={handleCheckout}>
      <Text style={styles.text}> المتابعة للدفع {" "} </Text>
    </Pressable>
  )
}
const styles = StyleSheet.create({
    button: {
      backgroundColor: "#30a1a7",
      padding: 12,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      width: "80%",
      marginTop: 10,
      alignSelf: "center",
    },
    text:{
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
    }
})