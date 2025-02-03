import React from 'react';
import {TextInput, TextInputProps, StyleSheet} from 'react-native';

type InputProps = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
};

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  style,
  ...props
}) => {
  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder="Enter other user id here"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});

export default Input;
