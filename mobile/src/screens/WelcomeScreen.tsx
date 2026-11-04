import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { ZappLogo } from '../components/ZappLogo';
import { DiscoveredTv, SavedTv, TvSettings } from '../types/tv';

interface WelcomeScreenProps {
  colors: ThemeColors;
  onGetStarted: () => void;
  savedTvs: SavedTv[];
  settings: TvSettings;
  connect: (tv: { ip: string; name?: string }) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  colors,
  onGetStarted,
  savedTvs,
  settings,
  connect,
}) => {
  const [isReady, setIsReady] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(12)).current;

  const runAnimation = () => {
    setIsReady(false);
    progressAnim.setValue(0);
    buttonOpacity.setValue(0);
    buttonSlide.setValue(12);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      setIsReady(true);
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  useEffect(() => {
    runAnimation();
  }, []);

  const handleStart = () => {
    if (settings.autoReconnect && savedTvs.length > 0) {
      connect({ ip: savedTvs[0].ip, name: savedTvs[0].name });
    }
    onGetStarted();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background Radial Glow */}
      <View
        style={[
          styles.halo,
          {
            backgroundColor: colors.glow,
          },
        ]}
      />

      {/* Top Replay Button */}
      <TouchableOpacity
        style={styles.replayBtn}
        activeOpacity={0.7}
        onPress={runAnimation}
      >
        <Text style={[styles.replayText, { color: colors.mute }]}>Replay</Text>
      </TouchableOpacity>

      {/* Centered Logo & Brand */}
      <View style={styles.centerContent}>
        <ZappLogo colors={colors} size={150} />

        <View style={styles.wordRow}>
          <Text style={[styles.wordChar, { color: colors.ink }]}>z</Text>
          <Text style={[styles.wordChar, { color: colors.ink }]}>a</Text>
          <Text style={[styles.wordChar, { color: colors.ink }]}>p</Text>
          <Text style={[styles.wordChar, { color: colors.ink }]}>p</Text>
        </View>

        <Text style={[styles.tagline, { color: colors.mute }]}>
          Your TV, in your hand.
        </Text>
      </View>

      {/* Footer Progress & Button */}
      <View style={styles.footer}>
        {!isReady ? (
          <View style={styles.loaderArea}>
            <View style={[styles.track, { backgroundColor: colors.key2 }]}>
              <Animated.View
                style={[
                  styles.trackFill,
                  {
                    backgroundColor: colors.acc,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.loaderText, { color: colors.mute }]}>
              Getting things ready…
            </Text>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.buttonWrapper,
              {
                opacity: buttonOpacity,
                transform: [{ translateY: buttonSlide }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.startBtn,
                { backgroundColor: colors.acc },
                colors.sh,
              ]}
              activeOpacity={0.85}
              onPress={handleStart}
            >
              <Text style={[styles.startBtnText, { color: colors.accink }]}>
                Get started
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '20%',
  },
  replayBtn: {
    position: 'absolute',
    top: 54,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  replayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  wordChar: {
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: -2.5,
    lineHeight: 64,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
  },
  footer: {
    marginTop: 44,
    width: '100%',
    maxWidth: 300,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderArea: {
    alignItems: 'center',
    gap: 12,
  },
  track: {
    width: 180,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonWrapper: {
    width: '100%',
  },
  startBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
});

