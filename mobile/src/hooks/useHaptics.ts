import { useCallback } from 'react';
import { Platform } from 'react-native';

export function useHaptics(enabled: boolean = true) {
  const triggerHaptic = useCallback(
    async (type: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enabled) return;

      try {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(type === 'heavy' ? 20 : 8);
          }
        } else {
          const Haptics = require('expo-haptics');
          if (type === 'light') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (type === 'medium') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }
      } catch (e) {
        // Haptics not supported or ignored
      }
    },
    [enabled],
  );

  return { triggerHaptic };
}

