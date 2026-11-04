import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/colors';

interface DPadProps {
  colors: ThemeColors;
  onPressDirection: (dir: 'up' | 'down' | 'left' | 'right' | 'ok') => void;
}

export const DPad: React.FC<DPadProps> = ({ colors, onPressDirection }) => {
  return (
    <View style={[styles.dpad, { backgroundColor: colors.key2 }]}>
      {/* Up Button */}
      <TouchableOpacity
        style={[styles.dirBtn, styles.upBtn]}
        activeOpacity={0.6}
        onPress={() => onPressDirection('up')}
        accessibilityLabel="Up"
        accessibilityRole="button"
      >
        <Text style={[styles.dirArrow, { color: colors.ink }]}>▲</Text>
      </TouchableOpacity>

      {/* Left Button */}
      <TouchableOpacity
        style={[styles.dirBtn, styles.leftBtn]}
        activeOpacity={0.6}
        onPress={() => onPressDirection('left')}
        accessibilityLabel="Left"
        accessibilityRole="button"
      >
        <Text style={[styles.dirArrow, { color: colors.ink }]}>◀</Text>
      </TouchableOpacity>

      {/* Center OK Button */}
      <TouchableOpacity
        style={[
          styles.okBtn,
          { backgroundColor: colors.acc },
          colors.sh,
        ]}
        activeOpacity={0.8}
        onPress={() => onPressDirection('ok')}
        accessibilityLabel="OK"
        accessibilityRole="button"
      >
        <Text style={[styles.okText, { color: colors.accink }]}>OK</Text>
      </TouchableOpacity>

      {/* Right Button */}
      <TouchableOpacity
        style={[styles.dirBtn, styles.rightBtn]}
        activeOpacity={0.6}
        onPress={() => onPressDirection('right')}
        accessibilityLabel="Right"
        accessibilityRole="button"
      >
        <Text style={[styles.dirArrow, { color: colors.ink }]}>▶</Text>
      </TouchableOpacity>

      {/* Down Button */}
      <TouchableOpacity
        style={[styles.dirBtn, styles.downBtn]}
        activeOpacity={0.6}
        onPress={() => onPressDirection('down')}
        accessibilityLabel="Down"
        accessibilityRole="button"
      >
        <Text style={[styles.dirArrow, { color: colors.ink }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dpad: {
    width: 216,
    height: 216,
    borderRadius: 108,
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  dirBtn: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dirArrow: {
    fontSize: 20,
    fontWeight: '700',
  },
  upBtn: {
    top: 6,
    left: 76,
  },
  downBtn: {
    bottom: 6,
    left: 76,
  },
  leftBtn: {
    left: 6,
    top: 76,
  },
  rightBtn: {
    right: 6,
    top: 76,
  },
  okBtn: {
    position: 'absolute',
    left: 62,
    top: 62,
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

