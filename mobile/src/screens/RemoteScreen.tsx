import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { TvScreenPreview, APPS } from '../components/TvScreenPreview';
import { DPad } from '../components/DPad';
import { TvState, RemoteKey } from '../types/tv';
import { useHaptics } from '../hooks/useHaptics';

interface RemoteScreenProps {
  colors: ThemeColors;
  tvState: TvState;
  onSendKey: (key: RemoteKey) => void;
  onSendPower: () => void;
  onSendAppLink: (url: string) => void;
  onGoToConnect: () => void;
  hapticEnabled: boolean;
  showToast: (msg: string) => void;
}

const INPUTS = ['Home', 'TV', 'HDMI 1', 'HDMI 2', 'AV'];

export const RemoteScreen: React.FC<RemoteScreenProps> = ({
  colors,
  tvState,
  onSendKey,
  onSendPower,
  onSendAppLink,
  onGoToConnect,
  hapticEnabled,
  showToast,
}) => {
  const { triggerHaptic } = useHaptics(hapticEnabled);

  const [focusIndex, setFocusIndex] = useState(0);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [channelNumber, setChannelNumber] = useState(7);
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const [osdProgress, setOsdProgress] = useState<number | null>(null);

  const osdTimerRef = useRef<any>(null);
  const numBufferRef = useRef<string>('');
  const numTimerRef = useRef<any>(null);

  const showOsd = (msg: string, progress: number | null = null) => {
    setOsdMessage(msg);
    setOsdProgress(progress);
    if (osdTimerRef.current) clearTimeout(osdTimerRef.current);
    osdTimerRef.current = setTimeout(() => {
      setOsdMessage(null);
      setOsdProgress(null);
    }, 1800);
  };

  const checkReady = () => {
    if (!tvState.connected) {
      showToast('Connect a TV first');
      return false;
    }
    if (!tvState.powered) {
      showOsd('TV is off');
      return false;
    }
    return true;
  };

  const handlePower = () => {
    triggerHaptic('heavy');
    if (!tvState.connected) {
      showToast('Connect a TV first');
      return;
    }
    onSendPower();
    showOsd(tvState.powered ? 'Powering off' : 'Welcome back');
  };

  const handleSource = () => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey('source');
    const currentIdx = INPUTS.indexOf(tvState.activeInput || 'Home');
    const nextInput = INPUTS[(currentIdx + 1) % INPUTS.length];
    showOsd(`Input: ${nextInput}`);
  };

  const handleMute = () => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey('mute');
    const willMute = !tvState.volume.muted;
    showOsd(willMute ? 'Muted' : 'Sound on', willMute ? 0 : tvState.volume.level);
  };

  const handleVolume = (delta: number) => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey(delta > 0 ? 'vol_up' : 'vol_down');
    const newVol = Math.max(0, Math.min(100, tvState.volume.level + delta * 5));
    showOsd(`Volume ${newVol}`, newVol);
  };

  const handleChannel = (delta: number) => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey(delta > 0 ? 'ch_up' : 'ch_down');
    const newCh = ((channelNumber - 1 + delta + 99) % 99) + 1;
    setChannelNumber(newCh);
    showOsd(`Channel ${newCh}`);
  };

  const handleDPad = (dir: 'up' | 'down' | 'left' | 'right' | 'ok') => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey(dir);

    const totalApps = APPS.length;
    if (tvState.activeInput === 'Home' && !tvState.currentApp) {
      if (dir === 'left') setFocusIndex((prev) => (prev + totalApps - 1) % totalApps);
      if (dir === 'right') setFocusIndex((prev) => (prev + 1) % totalApps);
      if (dir === 'up') setFocusIndex((prev) => (prev + totalApps - 3) % totalApps);
      if (dir === 'down') setFocusIndex((prev) => (prev + 3) % totalApps);
      if (dir === 'ok') {
        const selectedApp = APPS[focusIndex];
        onSendAppLink(selectedApp.name);
      }
    } else if (tvState.activeInput === 'TV') {
      if (dir === 'up') handleChannel(1);
      if (dir === 'down') handleChannel(-1);
      if (dir === 'left') handleVolume(-1);
      if (dir === 'right') handleVolume(1);
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey('back');
    if (tvState.currentApp) {
      showOsd('Home');
    }
  };

  const handleHome = () => {
    triggerHaptic('light');
    if (!checkReady()) return;
    onSendKey('home');
    showOsd('Home');
  };

  const handleNumberInput = (num: string) => {
    triggerHaptic('light');
    if (!checkReady()) return;

    if (num === 'del') {
      numBufferRef.current = numBufferRef.current.slice(0, -1);
    } else {
      numBufferRef.current = (numBufferRef.current + num).slice(-2);
    }

    showOsd(`Channel ${numBufferRef.current || '–'}`);

    if (numTimerRef.current) clearTimeout(numTimerRef.current);
    numTimerRef.current = setTimeout(() => {
      const parsed = parseInt(numBufferRef.current, 10);
      numBufferRef.current = '';
      if (!isNaN(parsed) && parsed > 0) {
        setChannelNumber(parsed);
        showOsd(`Channel ${parsed}`);
      }
    }, 1300);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top TV Connection Chip */}
      <TouchableOpacity
        style={[styles.chip, { backgroundColor: colors.card }, colors.shSmall]}
        activeOpacity={0.8}
        onPress={onGoToConnect}
      >
        <View
          style={[
            styles.chipDot,
            { backgroundColor: tvState.connected ? colors.ok : colors.mute },
          ]}
        />
        <View style={styles.chipTextWrap}>
          <Text style={[styles.chipTitle, { color: colors.ink }]}>
            {tvState.connected ? tvState.name || 'Android TV' : 'No TV connected'}
          </Text>
          <Text style={[styles.chipSubtitle, { color: colors.mute }]}>
            {tvState.connected ? tvState.ip : 'Tap to choose a TV'}
          </Text>
        </View>
        <Text style={[styles.chipChange, { color: colors.mute }]}>Change</Text>
      </TouchableOpacity>

      {/* Simulated TV Screen Preview */}
      <TvScreenPreview
        colors={colors}
        tvState={tvState}
        focusIndex={focusIndex}
        osdMessage={osdMessage}
        osdProgress={osdProgress}
      />

      {/* Remote Control Panel */}
      <View style={[styles.remoteCard, { backgroundColor: colors.card }, colors.sh]}>
        {/* Row 1: Power, Source, Mute */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.remoteBtn, styles.powerBtn]}
            activeOpacity={0.8}
            onPress={handlePower}
            accessibilityLabel="Power"
          >
            <Text style={styles.powerIcon}>⏻</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.remoteBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.8}
            onPress={handleSource}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Source</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.remoteBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.8}
            onPress={handleMute}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Mute</Text>
          </TouchableOpacity>
        </View>

        {/* Circular D-Pad */}
        <DPad colors={colors} onPressDirection={handleDPad} />

        {/* Row 2: Back, Home, 123 Toggle */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.remoteBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.8}
            onPress={handleBack}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.remoteBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.8}
            onPress={handleHome}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.remoteBtn,
              {
                backgroundColor: showNumberPad ? colors.acc : colors.key2,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('light');
              setShowNumberPad((prev) => !prev);
            }}
          >
            <Text
              style={[
                styles.btnText,
                { color: showNumberPad ? colors.accink : colors.mute },
              ]}
            >
              123
            </Text>
          </TouchableOpacity>
        </View>

        {/* Number Pad Grid (expandable) */}
        {showNumberPad && (
          <View style={styles.numberGrid}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['', '0', 'del'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.numberRow}>
                {row.map((val, cIdx) =>
                  val === '' ? (
                    <View key={cIdx} style={styles.numPlaceholder} />
                  ) : (
                    <TouchableOpacity
                      key={cIdx}
                      style={[styles.numBtn, { backgroundColor: colors.key2 }]}
                      activeOpacity={0.7}
                      onPress={() => handleNumberInput(val)}
                    >
                      <Text style={[styles.numText, { color: colors.ink }]}>
                        {val === 'del' ? '⌫' : val}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            ))}
          </View>
        )}

        {/* Volume & Channel Rockers */}
        <View style={styles.rockerRow}>
          {/* Volume Pill */}
          <View style={[styles.rockerPill, { backgroundColor: colors.key2 }]}>
            <TouchableOpacity
              style={styles.rockerBtn}
              activeOpacity={0.7}
              onPress={() => handleVolume(1)}
              accessibilityLabel="Volume up"
            >
              <Text style={[styles.rockerIcon, { color: colors.ink }]}>+</Text>
            </TouchableOpacity>
            <Text style={[styles.rockerLabel, { color: colors.mute }]}>Vol</Text>
            <TouchableOpacity
              style={styles.rockerBtn}
              activeOpacity={0.7}
              onPress={() => handleVolume(-1)}
              accessibilityLabel="Volume down"
            >
              <Text style={[styles.rockerIcon, { color: colors.ink }]}>−</Text>
            </TouchableOpacity>
          </View>

          {/* Channel Pill */}
          <View style={[styles.rockerPill, { backgroundColor: colors.key2 }]}>
            <TouchableOpacity
              style={styles.rockerBtn}
              activeOpacity={0.7}
              onPress={() => handleChannel(1)}
              accessibilityLabel="Channel up"
            >
              <Text style={[styles.rockerIcon, { color: colors.ink }]}>▲</Text>
            </TouchableOpacity>
            <Text style={[styles.rockerLabel, { color: colors.mute }]}>Ch</Text>
            <TouchableOpacity
              style={styles.rockerBtn}
              activeOpacity={0.7}
              onPress={() => handleChannel(-1)}
              accessibilityLabel="Channel down"
            >
              <Text style={[styles.rockerIcon, { color: colors.ink }]}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  chipDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  chipTextWrap: {
    flex: 1,
  },
  chipTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chipChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  remoteCard: {
    borderRadius: 28,
    padding: 16,
    gap: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  remoteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBtn: {
    backgroundColor: '#d93a43',
  },
  powerIcon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  numberGrid: {
    gap: 8,
    marginVertical: 4,
  },
  numberRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numPlaceholder: {
    flex: 1,
  },
  numBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 18,
    fontWeight: '700',
  },
  rockerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rockerPill: {
    flex: 1,
    borderRadius: 26,
    padding: 4,
    alignItems: 'center',
  },
  rockerBtn: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rockerIcon: {
    fontSize: 22,
    fontWeight: '700',
  },
  rockerLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 2,
    textTransform: 'uppercase',
  },
});

