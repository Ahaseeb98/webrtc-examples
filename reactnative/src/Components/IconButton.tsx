import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import {IconProps} from 'react-native-vector-icons/Icon';

type IconButtonProps = {
  IconComponent: React.ReactElement<IconProps>; // Full icon component passed as a prop
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
};

const IconButton: React.FC<IconButtonProps & TouchableOpacityProps> = ({
  IconComponent,
  onPress,
  size = 30,
  color = 'black',
  backgroundColor = 'transparent',
  style = {},
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, {backgroundColor}]}
      onPress={onPress}>
      {React.cloneElement(IconComponent, {size, color})}
      {/* Pass size and color props to the icon */}
    </TouchableOpacity>
  );
};

export default IconButton;

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 50,
  },
});
