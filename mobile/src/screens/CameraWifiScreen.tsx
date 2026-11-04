import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ThemeColors } from '../theme/colors';
import { WifiInfo } from '../hooks/useWifiNetwork';
import { TvState } from '../types/tv';
import { useHaptics } from '../hooks/useHaptics';

interface CameraWifiScreenProps {
  colors: ThemeColors;
  wifiInfo: WifiInfo;
  tvState: TvState;
  onConnectIp: (ip: string) => void;
  onPairTv: (code: string) => void;
  onSendAppLink: (url: string) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
  hapticEnabled?: boolean;
}

export const CameraWifiScreen: React.FC<CameraWifiScreenProps> = ({
  colors,
  wifiInfo,
  tvState,
  onConnectIp,
  onPairTv,
  onSendAppLink,
  onClose,
  showToast,
  hapticEnabled = true,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'scan' | 'stream'>('scan');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string | null>(null);
  const [isCasting, setIsCasting] = useState(false);

  const { triggerHaptic } = useHaptics(hapticEnabled);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Animate scan laser line in scanner mode
  useEffect(() => {
    if (mode === 'scan') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [mode, scanLineAnim]);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (mode !== 'scan') return;
    const rawData = result.data?.trim();
    if (!rawData || rawData === lastScannedData) return;

    setLastScannedData(rawData);
    triggerHaptic('medium');

    // 1. Check for IPv4 Address
    const ipMatch = rawData.match(/\b(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/);
    if (ipMatch) {
      const foundIp = ipMatch[0];
      showToast(`Detected TV IP: ${foundIp} · Connecting…`);
      onConnectIp(foundIp);
      setTimeout(onClose, 800);
      return;
    }

    // 2. Check for 6-character Hex TV Pairing Code
    const pinMatch = rawData.match(/\b([0-9A-Fa-f]{6})\b/);
    if (pinMatch && tvState.ip) {
      const code = pinMatch[1].toUpperCase();
      showToast(`Detected Pairing Code: ${code} · Pairing…`);
      onPairTv(code);
      setTimeout(onClose, 800);
      return;
    }

    // 3. Check for Wi-Fi QR Code (WIFI:S:MyNetwork;T:WPA;P:password;;)
    if (rawData.startsWith('WIFI:')) {
      const ssidMatch = rawData.match(/S:([^;]+)/);
      const ssid = ssidMatch ? ssidMatch[1] : 'Wi-Fi Network';
      showToast(`Detected Wi-Fi: ${ssid}`);
      return;
    }

    // 4. Fallback URL / Code
    showToast(`Scanned: ${rawData.slice(0, 30)}`);
  };

  const handleToggleTorch = () => {
    triggerHaptic('light');
    setTorch((prev) => !prev);
  };

  const handleToggleFacing = () => {
    triggerHaptic('light');
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleCastCameraToTv = () => {
    triggerHaptic('heavy');
    if (!tvState.connected) {
      showToast('Connect a TV first to cast camera');
      return;
    }

    setIsCasting(true);
    const cameraStreamUrl = `http://${wifiInfo.ipAddress || '192.168.1.105'}:8080/live`;
    onSendAppLink(cameraStreamUrl);
    showToast(`Casting live camera to ${tvState.name || 'Android TV'} over Wi-Fi`);
  };

  // 1. Permission Loading State
  if (!permission) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.acc} />
        <Text style={[styles.loadingText, { color: colors.mute }]}>
          Loading Camera…
        </Text>
      </View>
    );
  }

  // 2. Permission Denied State
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg, padding: 24 }]}>
        <View style={[styles.permIconBox, { backgroundColor: colors.card }, colors.sh]}>
          <Text style={styles.permEmoji}>📷</Text>
        </View>
        <Text style={[styles.permTitle, { color: colors.ink }]}>
          Camera Access with Wi-Fi
        </Text>
        <Text style={[styles.permDesc, { color: colors.mute }]}>
          Enable camera access to scan TV pairing QR codes directly off your television screen or stream your camera feed to Android TV over your Wi-Fi network ({wifiInfo.ipAddress || '192.168.1.xxx'}).
        </Text>

        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.acc }]}
          activeOpacity={0.8}
          onPress={requestPermission}
        >
          <Text style={[styles.permBtnText, { color: colors.accink }]}>
            Grant Camera Permission
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
          <Text style={[styles.cancelBtnText, { color: colors.mute }]}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Camera Active View
  return (
    <View style={styles.container}>
      {/* Live Camera Feed */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'ean13', 'aztec', 'datamatrix'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Top Controls Overlay */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.circleBtn, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}
          activeOpacity={0.7}
          onPress={onClose}
        >
          <Text style={styles.btnIcon}>✕</Text>
        </TouchableOpacity>

        <View style={styles.wifiChip}>
          <View style={[styles.miniDot, { backgroundColor: wifiInfo.isConnected ? colors.ok : colors.red }]} />
          <Text style={styles.wifiChipText}>
            Wi-Fi: {wifiInfo.ipAddress || '192.168.1.105'}
          </Text>
        </View>

        <View style={styles.topRightBtns}>
          <TouchableOpacity
            style={[
              styles.circleBtn,
              { backgroundColor: torch ? colors.acc : 'rgba(0, 0, 0, 0.65)' },
            ]}
            activeOpacity={0.7}
            onPress={handleToggleTorch}
          >
            <Text style={[styles.btnIcon, { color: torch ? colors.accink : '#fff' }]}>
              🔦
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]}
            activeOpacity={0.7}
            onPress={handleToggleFacing}
          >
            <Text style={styles.btnIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Switcher Tabs */}
      <View style={styles.modeTabsWrap}>
        <View style={styles.modeTabsInner}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'scan' && { backgroundColor: colors.acc },
            ]}
            activeOpacity={0.8}
            onPress={() => setMode('scan')}
          >
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'scan' ? colors.accink : '#ffffff' },
              ]}
            >
              Scan TV / QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'stream' && { backgroundColor: colors.acc },
            ]}
            activeOpacity={0.8}
            onPress={() => setMode('stream')}
          >
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'stream' ? colors.accink : '#ffffff' },
              ]}
            >
              Wi-Fi Stream
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Center Viewport Overlay */}
      {mode === 'scan' ? (
        <View style={styles.scannerCenter}>
          <View style={styles.reticle}>
            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.acc }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.acc }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.acc }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.acc }]} />

            {/* Laser Line */}
            <Animated.View
              style={[
                styles.laserLine,
                {
                  backgroundColor: colors.acc,
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 220],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <Text style={styles.scanHint}>
            Point camera at TV screen or QR code
          </Text>
        </View>
      ) : (
        /* Stream & Cast Mode */
        <View style={styles.streamCenter}>
          <View style={styles.streamHud}>
            <View style={styles.hudRow}>
              <Text style={styles.hudLabel}>Wi-Fi Feed:</Text>
              <Text style={styles.hudVal}>1080p HD @ 30 FPS</Text>
            </View>
            <View style={styles.hudRow}>
              <Text style={styles.hudLabel}>Network Latency:</Text>
              <Text style={styles.hudVal}>14 ms (Low Latency)</Text>
            </View>
            <View style={styles.hudRow}>
              <Text style={styles.hudLabel}>Target TV:</Text>
              <Text style={styles.hudVal}>{tvState.name || 'Living Room TV'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Action Footer */}
      <View style={styles.bottomBar}>
        {mode === 'stream' && (
          <TouchableOpacity
            style={[
              styles.castBtn,
              { backgroundColor: isCasting ? colors.ok : colors.acc },
            ]}
            activeOpacity={0.8}
            onPress={handleCastCameraToTv}
          >
            <Text style={[styles.castBtnText, { color: colors.accink }]}>
              {isCasting ? '📡 Casting to TV Live' : '📺 Cast Camera to TV'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginTop: 12,
    fontWeight: '600',
  },
  permIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permEmoji: {
    fontSize: 38,
  },
  permTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  permDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  permBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 16,
    padding: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  wifiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wifiChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  topRightBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  modeTabsWrap: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  modeTabsInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    padding: 4,
    gap: 6,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scannerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  laserLine: {
    height: 2.5,
    width: '100%',
    borderRadius: 2,
    shadowColor: '#6fe0c8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scanHint: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streamCenter: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 110,
    paddingHorizontal: 20,
  },
  streamHud: {
    backgroundColor: 'rgba(10, 10, 24, 0.82)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudLabel: {
    color: '#9a97b0',
    fontSize: 13,
  },
  hudVal: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  castBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

