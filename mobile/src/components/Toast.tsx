import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/colors';

interface ToastProps {
  colors: ThemeColors;
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ colors, message }) => {
  if (!message) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.toast, { backgroundColor: colors.ink }]}>
        <Text style={[styles.text, { color: colors.bg }]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 84,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

