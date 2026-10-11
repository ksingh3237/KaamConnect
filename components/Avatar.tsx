// A person's photo: the real one from the API when there is one, otherwise a local placeholder
// (assets/images/avatar-placeholder.png is a temporary stand-in until real design assets exist).
import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const PLACEHOLDER = require('../assets/images/avatar-placeholder.png');

export default function Avatar({ uri, size = 48, style }: { uri?: string | null; size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={uri ? { uri } : PLACEHOLDER}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E6F7F0' }, style]}
      accessibilityIgnoresInvertColors
    />
  );
}
