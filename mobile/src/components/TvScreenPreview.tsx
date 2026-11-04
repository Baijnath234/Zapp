import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { TvState } from '../types/tv';

export const APPS = [
  { name: 'Stream', color: '#e5484d' },
  { name: 'Movies', color: '#3b6cf6' },
  { name: 'Music', color: '#9b51e0' },
  { name: 'Sports', color: '#16a36a' },
  { name: 'Games', color: '#e08a1e' },
  { name: 'Photos', color: '#0f8fa8' },
];

interface TvScreenPreviewProps {
  colors: ThemeColors;
  tvState: TvState;
  focusIndex: number;
  osdMessage: string | null;
  osdProgress: number | null; // 0 to 100
}

export const TvScreenPreview: React.FC<TvScreenPreviewProps> = ({
  colors,
  tvState,
  focusIndex,
  osdMessage,
  osdProgress,
}) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const isPowerOn = tvState.powered && tvState.connected;

  return (
    <View style={styles.tvBezel}>
      <View style={[styles.screen, !isPowerOn && styles.screenOff]}>
        {isPowerOn ? (
          <>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Text style={styles.topInput}>
                {tvState.currentApp ? tvState.currentApp : tvState.activeInput}
              </Text>
              <Text style={styles.topClock}>{time}</Text>
            </View>

            {/* Main Screen Content */}
            <View style={styles.contentArea}>
              {tvState.currentApp ? (
                <View style={styles.bannerContainer}>
                  <Text style={styles.bannerTitle}>{tvState.currentApp}</Text>
                  <Text style={styles.bannerSub}>Now playing. Press Back to return.</Text>
                </View>
              ) : tvState.activeInput === 'TV' ? (
                <View style={styles.bannerContainer}>
                  <Text style={styles.bannerTitle}>LIVE TV</Text>
                  <Text style={styles.bannerSub}>Channel Guide Active</Text>
                </View>
              ) : tvState.activeInput !== 'Home' ? (
                <View style={styles.bannerContainer}>
                  <Text style={styles.bannerTitle}>{tvState.activeInput}</Text>
                  <Text style={styles.bannerSub}>No signal. Check the cable.</Text>
                </View>
              ) : (
                /* Home Apps Grid */
                <View style={styles.grid}>
                  {APPS.map((app, index) => {
                    const isFocused = index === focusIndex;
                    return (
                      <View
                        key={app.name}
                        style={[
                          styles.tile,
                          { backgroundColor: app.color },
                          isFocused && styles.tileFocused,
                        ]}
                      >
                        <Text style={styles.tileText}>{app.name}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* OSD Overlay */}
            {osdMessage !== null && (
              <View style={styles.osd}>
                <Text style={styles.osdText}>{osdMessage}</Text>
                {osdProgress !== null && (
                  <View style={styles.osdBarTrack}>
                    <View
                      style={[
                        styles.osdBarFill,
                        { width: `${Math.max(0, Math.min(100, osdProgress))}%` },
                      ]}
                    />
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.screenOffContainer}>
            <Text style={styles.screenOffText}>
              {!tvState.connected ? 'No TV Connected' : 'TV is Off'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tvBezel: {
    backgroundColor: '#12111c',
    borderRadius: 14,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  screen: {
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1d1b30',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 12,
  },
  screenOff: {
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenOffContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenOffText: {
    color: '#444256',
    fontSize: 13,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topInput: {
    color: '#f1f0f8',
    fontSize: 11,
    opacity: 0.8,
    fontWeight: '600',
  },
  topClock: {
    color: '#f1f0f8',
    fontSize: 11,
    opacity: 0.8,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
  },
  tile: {
    width: '31%',
    height: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  tileFocused: {
    transform: [{ scale: 1.08 }],
    borderWidth: 2.5,
    borderColor: '#6fe0c8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  tileText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bannerSub: {
    color: '#a09eb5',
    fontSize: 12,
    marginTop: 4,
  },
  osd: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 9,
    backgroundColor: 'rgba(10, 10, 20, 0.88)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  osdText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  osdBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  osdBarFill: {
    height: '100%',
    backgroundColor: '#6fe0c8',
  },
});

