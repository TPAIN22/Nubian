import React from 'react';
import { TextInput, StyleSheet } from 'react-native'; // استورد StyleSheet إذا كنت ستستخدمه

interface InputsProps {
  placeholder?: string; // جعلها اختيارية إذا لم تكن مطلوبة دائمًا
  onChangeText: (text: string) => void;
  value: string;
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  style?: any;
}

const Inputs: React.FC<InputsProps> = ({
  placeholder = 'Search', 
  onChangeText,
  value,
  multiline = false,
  numberOfLines = 1,
  textAlignVertical = 'auto',
  style,
}) => {
  return (
    <TextInput
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={textAlignVertical}
      style={[styles.input, style]} 
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

export default Inputs;