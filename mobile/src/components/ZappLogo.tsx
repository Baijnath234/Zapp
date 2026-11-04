import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { ThemeColors } from '../theme/colors';

interface ZappLogoProps {
  colors: ThemeColors;
  size?: number;
}

export const ZappLogo: React.FC<ZappLogoProps> = ({ colors, size = 150 }) => {
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.3)).current;
  const waveAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const a1 = pulse(waveAnim1, 0);
    const a2 = pulse(waveAnim2, 300);
    const a3 = pulse(waveAnim3, 600);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [waveAnim1, waveAnim2, waveAnim3]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg viewBox="0 0 120 120" width="100%" height="100%">
        {/* TV Body */}
        <Rect
          x={14}
          y={24}
          width={92}
          height={64}
          rx={17}
          fill={colors.card}
          stroke={colors.ink}
          strokeWidth={5}
        />
        {/* TV Stand */}
        <Path
          d="M44 102H76"
          stroke={colors.ink}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* Signal Radiating Arcs */}
        <Path
          d="M44 64A10 10 0 0 1 54 74"
          fill="none"
          stroke={colors.acc}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
        <Path
          d="M44 52A22 22 0 0 1 66 74"
          fill="none"
          stroke={colors.acc}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
        <Path
          d="M44 40A34 34 0 0 1 78 74"
          fill="none"
          stroke={colors.acc}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
        {/* Pulse Emitter Dot */}
        <Circle cx={44} cy={74} r={5.5} fill={colors.acc} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});

