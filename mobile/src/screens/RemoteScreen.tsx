import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  PanResponder,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { TvScreenPreview } from '../components/TvScreenPreview';
import { DPad } from '../components/DPad';
import { TvState, RemoteKey } from '../types/tv';
import { useHaptics } from '../hooks/useHaptics';

export const STREAMING_APPS = [
  { name: 'YouTube', color: '#ff0000', icon: '▶', url: 'https://www.youtube.com' },
  { name: 'Netflix', color: '#e50914', icon: 'N', url: 'https://www.netflix.com' },
  { name: 'Prime Video', color: '#00a8e1', icon: 'P', url: 'https://app.primevideo.com' },
  { name: 'Disney+', color: '#113ccf', icon: 'D+', url: 'https://www.disneyplus.com' },
  { name: 'Spotify', color: '#1db954', icon: '♫', url: 'https://open.spotify.com' },
];

interface RemoteScreenProps {
  colors: ThemeColors;
  tvState: TvState;
  onSendKey: (key: RemoteKey) => void;
  onSendPower: () => void;
  onSendAppLink: (url: string) => void;
  onSendText?: (text: string) => void;
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
  onSendText,
  onGoToConnect,
  hapticEnabled,
  showToast,
}) => {
  const { triggerHaptic } = useHaptics(hapticEnabled);

  const [controlMode, setControlMode] = useState<'dpad' | 'trackpad'>('dpad');
  const [showKeyboardModal, setShowKeyboardModal] = useState(false);
  const [textInputVal, setTextInputVal] = useState('');
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

    const totalApps = STREAMING_APPS.length;
    if (tvState.activeInput === 'Home' && !tvState.currentApp) {
      if (dir === 'left') setFocusIndex((prev) => (prev + totalApps - 1) % totalApps);
      if (dir === 'right') setFocusIndex((prev) => (prev + 1) % totalApps);
      if (dir === 'up') setFocusIndex((prev) => (prev + totalApps - 3) % totalApps);
      if (dir === 'down') setFocusIndex((prev) => (prev + 3) % totalApps);
      if (dir === 'ok') {
        const selectedApp = STREAMING_APPS[focusIndex];
        if (selectedApp) {
          onSendAppLink(selectedApp.url);
          showOsd(`Launching ${selectedApp.name}`);
        }
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

  const handleSendTextSubmit = () => {
    if (!textInputVal.trim()) return;
    triggerHaptic('medium');
    if (onSendText) {
      onSendText(textInputVal.trim());
      showToast(`Sent "${textInputVal.trim()}" to TV`);
    }
    setTextInputVal('');
    setShowKeyboardModal(false);
  };

  // Touchpad PanResponder for swipe navigation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const threshold = 25;

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
          // Single tap = OK
          handleDPad('ok');
        } else if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > threshold) {
            handleDPad('right');
          } else if (dx < -threshold) {
            handleDPad('left');
          }
        } else {
          if (dy > threshold) {
            handleDPad('down');
          } else if (dy < -threshold) {
            handleDPad('up');
          }
        }
      },
    }),
  ).current;

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

      {/* Quick Streaming Apps Bar */}
      <View style={[styles.appsBarCard, { backgroundColor: colors.card }, colors.shSmall]}>
        <Text style={[styles.appsBarTitle, { color: colors.mute }]}>QUICK LAUNCH APPS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.appsScroll}>
          {STREAMING_APPS.map((app) => (
            <TouchableOpacity
              key={app.name}
              style={[styles.appBadge, { backgroundColor: colors.key2 }]}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic('medium');
                if (!checkReady()) return;
                onSendAppLink(app.url);
                showOsd(`Launching ${app.name}`);
              }}
            >
              <View style={[styles.appIconCircle, { backgroundColor: app.color }]}>
                <Text style={styles.appIconLetter}>{app.icon}</Text>
              </View>
              <Text style={[styles.appBadgeText, { color: colors.ink }]}>{app.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Remote Control Panel */}
      <View style={[styles.remoteCard, { backgroundColor: colors.card }, colors.sh]}>
        {/* Row 1: Power, Source, Mute, Keyboard Search */}
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

          {/* Keyboard Search on TV Button */}
          <TouchableOpacity
            style={[styles.remoteBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('light');
              setShowKeyboardModal(true);
            }}
            accessibilityLabel="Keyboard Search"
          >
            <Text style={styles.keyboardIcon}>⌨️</Text>
          </TouchableOpacity>
        </View>

        {/* D-Pad vs Trackpad Mode Selector */}
        <View style={styles.modePillRow}>
          <TouchableOpacity
            style={[
              styles.navModeBtn,
              controlMode === 'dpad' && { backgroundColor: colors.acc },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('light');
              setControlMode('dpad');
            }}
          >
            <Text
              style={[
                styles.navModeText,
                { color: controlMode === 'dpad' ? colors.accink : colors.mute },
              ]}
            >
              D-Pad
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navModeBtn,
              controlMode === 'trackpad' && { backgroundColor: colors.acc },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('light');
              setControlMode('trackpad');
            }}
          >
            <Text
              style={[
                styles.navModeText,
                { color: controlMode === 'trackpad' ? colors.accink : colors.mute },
              ]}
            >
              Trackpad
            </Text>
          </TouchableOpacity>
        </View>

        {/* Central Controller: D-Pad OR Touchpad Surface */}
        {controlMode === 'dpad' ? (
          <DPad colors={colors} onPressDirection={handleDPad} />
        ) : (
          <View
            style={[styles.trackpadSurface, { backgroundColor: colors.key2 }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.trackpadCenterIcon}>
              <Text style={[styles.trackpadHint, { color: colors.mute }]}>
                Swipe to Navigate · Tap to Select (OK)
              </Text>
            </View>
          </View>
        )}

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

      {/* Mobile Keyboard to TV Modal */}
      <Modal
        visible={showKeyboardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyboardModal(false)}
      >
        <View style={styles.modalScrim}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }, colors.sh]}>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>Type on TV</Text>
            <Text style={[styles.modalSub, { color: colors.mute }]}>
              Type text, titles or search queries to send directly to your TV.
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.key2, color: colors.ink }]}
              value={textInputVal}
              onChangeText={setTextInputVal}
              placeholder="e.g. Inception or Stranger Things"
              placeholderTextColor={colors.mute}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSendTextSubmit}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.acc }]}
                activeOpacity={0.8}
                onPress={handleSendTextSubmit}
              >
                <Text style={[styles.modalBtnText, { color: colors.accink }]}>Send to TV</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.key2 }]}
                activeOpacity={0.8}
                onPress={() => setShowKeyboardModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.ink }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  appsBarCard: {
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },
  appsBarTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appsScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
  },
  appIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconLetter: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  appBadgeText: {
    fontSize: 13,
    fontWeight: '700',
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
  keyboardIcon: {
    fontSize: 20,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modePillRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  navModeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 11,
  },
  navModeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  trackpadSurface: {
    width: 220,
    height: 220,
    borderRadius: 24,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  trackpadCenterIcon: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trackpadHint: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
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
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    marginTop: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
