import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { DiscoveredTv, SavedTv, TvSettings, TvState } from '../types/tv';
import { ParsedServerConfig } from '../services/serverConfig';

interface ConnectionScreenProps {
  colors: ThemeColors;
  tvState: TvState;
  discoveredTvs: DiscoveredTv[];
  savedTvs: SavedTv[];
  isScanning: boolean;
  settings: TvSettings;
  backendHost?: string;
  isSocketConnected?: boolean;
  serverLatency?: number;
  serverConfig?: ParsedServerConfig;
  onScan: () => void;
  onConnect: (tv: { ip: string; name?: string; model?: string }) => void;
  onConnectIp: (ip: string) => void;
  onDisconnect: () => void;
  onForgetTv: (ip: string) => void;
  onUpdateSetting: (key: keyof TvSettings, value: boolean) => void;
  onUpdateBackendHost?: (host: string) => void;
  onOpenCamera?: () => void;
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
  colors,
  tvState,
  discoveredTvs,
  savedTvs,
  isScanning,
  settings,
  backendHost = 'localhost',
  isSocketConnected = false,
  serverLatency = 0,
  serverConfig,
  onScan,
  onConnect,
  onConnectIp,
  onDisconnect,
  onForgetTv,
  onUpdateSetting,
  onUpdateBackendHost,
  onOpenCamera,
}) => {
  const [ipInput, setIpInput] = useState('');
  const [ipError, setIpError] = useState('');
  const [hostInput, setHostInput] = useState(backendHost);
  const [showHostInput, setShowHostInput] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState<{ [key: string]: boolean }>({});

  const handleIpConnect = () => {
    const trimmed = ipInput.trim();
    const isValid = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(
      trimmed,
    );

    if (!isValid) {
      setIpError('Enter an address like 192.168.1.50');
      return;
    }

    setIpError('');
    onConnectIp(trimmed);
  };

  const handleHostSave = () => {
    if (onUpdateBackendHost && hostInput.trim()) {
      onUpdateBackendHost(hostInput.trim());
      setShowHostInput(false);
    }
  };

  const toggleFaq = (key: string) => {
    setFaqExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.pageTitle, { color: colors.ink }]}>Connection</Text>
        <View style={styles.serverStatusBadge}>
          <View
            style={[
              styles.miniDot,
              { backgroundColor: isSocketConnected ? colors.ok : colors.mute },
            ]}
          />
          <Text style={[styles.serverStatusText, { color: colors.mute }]}>
            {isSocketConnected
              ? `${serverConfig?.isCloud ? 'Cloud ☁️' : 'Local 🏠'}${serverLatency > 0 ? ` · ${serverLatency}ms` : ' · Live'}`
              : 'Offline / Standalone'}
          </Text>
        </View>
      </View>

      {/* 1. Status Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: tvState.connected ? colors.ok : colors.mute },
            ]}
          />
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusTitle, { color: colors.ink }]}>
              {tvState.connected
                ? `Connected to ${tvState.name || 'Android TV'}`
                : 'Not connected'}
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.mute }]}>
              {tvState.connected
                ? tvState.ip
                : 'Pick a TV below to get started'}
            </Text>
          </View>
          {tvState.connected && (
            <TouchableOpacity
              style={styles.discBtn}
              activeOpacity={0.7}
              onPress={onDisconnect}
            >
              <Text style={[styles.discText, { color: colors.red }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.caption, { color: colors.mute, marginTop: 12 }]}>
          Your phone and TV must be on the same Wi-Fi network.
        </Text>
      </View>

      {/* 2. Discovered TVs Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            Android TVs nearby
          </Text>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.7}
            onPress={onScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color={colors.acc} />
            ) : (
              <Text style={[styles.smallBtnText, { color: colors.ink }]}>
                Scan again
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {isScanning && discoveredTvs.length === 0 ? (
            <Text style={[styles.caption, { color: colors.mute }]}>
              Looking for TVs on your Wi-Fi…
            </Text>
          ) : discoveredTvs.length === 0 ? (
            <Text style={[styles.caption, { color: colors.mute }]}>
              No Android TVs found yet. Tap "Scan again" to search.
            </Text>
          ) : (
            discoveredTvs.map((tv) => {
              const isPaired = savedTvs.some((s) => s.ip === tv.ip);
              const isCurrent = tvState.connected && tvState.ip === tv.ip;

              return (
                <TouchableOpacity
                  key={tv.id || tv.ip}
                  style={[styles.deviceItem, { backgroundColor: colors.key2 }]}
                  activeOpacity={0.8}
                  onPress={() => onConnect(tv)}
                >
                  <View style={[styles.tvIcon, { borderColor: colors.mute }]} />
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.ink }]}>
                      {tv.name}
                    </Text>
                    <Text style={[styles.deviceSub, { color: colors.mute }]}>
                      {tv.model} · {tv.ip}
                    </Text>
                  </View>
                  <View style={styles.badgeWrap}>
                    {isCurrent ? (
                      <Text style={[styles.tag, { color: colors.ok }]}>
                        Connected
                      </Text>
                    ) : isPaired ? (
                      <Text style={[styles.tag, { color: colors.ok }]}>
                        Paired
                      </Text>
                    ) : (
                      <Text style={[styles.tag, { color: colors.mute }]}>
                        Pair
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* 3. Connect with IP Address */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 12 }]}>
          Connect with IP address
        </Text>
        <View style={styles.ipRow}>
          <TextInput
            style={[
              styles.ipInput,
              {
                backgroundColor: colors.key2,
                color: colors.ink,
                borderColor: ipError ? colors.red : 'transparent',
              },
            ]}
            value={ipInput}
            onChangeText={(txt) => {
              setIpInput(txt);
              if (ipError) setIpError('');
            }}
            placeholder="192.168.1.50"
            placeholderTextColor={colors.mute}
            keyboardType="decimal-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.ipGoBtn, { backgroundColor: colors.acc }]}
            activeOpacity={0.8}
            onPress={handleIpConnect}
          >
            <Text style={[styles.ipGoText, { color: colors.accink }]}>
              Connect
            </Text>
          </TouchableOpacity>
        </View>
        {ipError ? (
          <Text style={[styles.errText, { color: colors.red }]}>{ipError}</Text>
        ) : null}
        <Text style={[styles.caption, { color: colors.mute, marginTop: 6 }]}>
          Find it on your TV under Settings, Network.
        </Text>

        {onOpenCamera && (
          <TouchableOpacity
            style={[styles.cameraActionBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.7}
            onPress={onOpenCamera}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cameraTitle, { color: colors.ink }]}>
                Scan with Camera
              </Text>
              <Text style={[styles.cameraSub, { color: colors.mute }]}>
                Scan QR or pairing code over Wi-Fi
              </Text>
            </View>
            <Text style={[styles.cameraArrow, { color: colors.acc }]}>Open →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Saved TVs Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 10 }]}>
          Saved TVs
        </Text>
        <View style={styles.list}>
          {savedTvs.length === 0 ? (
            <Text style={[styles.caption, { color: colors.mute }]}>
              No saved TVs yet. TVs you pair appear here.
            </Text>
          ) : (
            savedTvs.map((tv) => {
              const isCurrent = tvState.connected && tvState.ip === tv.ip;
              return (
                <View
                  key={tv.ip}
                  style={[styles.deviceItem, { backgroundColor: colors.key2 }]}
                >
                  <View style={[styles.tvIcon, { borderColor: colors.mute }]} />
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.ink }]}>
                      {tv.name}
                    </Text>
                    <Text style={[styles.deviceSub, { color: colors.mute }]}>
                      {tv.ip}
                      {isCurrent ? ' · Connected' : ''}
                    </Text>
                  </View>
                  <View style={styles.savedActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.card }]}
                      activeOpacity={0.7}
                      onPress={() => onConnect(tv)}
                    >
                      <Text style={[styles.actionText, { color: colors.ink }]}>
                        Use
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.card }]}
                      activeOpacity={0.7}
                      onPress={() => onForgetTv(tv.ip)}
                    >
                      <Text style={[styles.actionText, { color: colors.red }]}>
                        Forget
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* 5. Options Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 6 }]}>
          Options
        </Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextWrap}>
            <Text style={[styles.toggleTitle, { color: colors.ink }]}>
              Reconnect automatically
            </Text>
            <Text style={[styles.toggleSub, { color: colors.mute }]}>
              Skip setup when you open the app
            </Text>
          </View>
          <Switch
            value={settings.autoReconnect}
            onValueChange={(val) => onUpdateSetting('autoReconnect', val)}
            trackColor={{ false: colors.key2, true: colors.acc }}
            thumbColor={Platform.OS === 'android' ? colors.card : undefined}
          />
        </View>

        <View style={[styles.toggleRow, { borderTopColor: colors.key2, borderTopWidth: 1 }]}>
          <View style={styles.toggleTextWrap}>
            <Text style={[styles.toggleTitle, { color: colors.ink }]}>
              Turn TV on when connecting
            </Text>
            <Text style={[styles.toggleSub, { color: colors.mute }]}>
              Sends a wake signal over Wi-Fi
            </Text>
          </View>
          <Switch
            value={settings.wakeOnConnect}
            onValueChange={(val) => onUpdateSetting('wakeOnConnect', val)}
            trackColor={{ false: colors.key2, true: colors.acc }}
            thumbColor={Platform.OS === 'android' ? colors.card : undefined}
          />
        </View>

        <View style={[styles.toggleRow, { borderTopColor: colors.key2, borderTopWidth: 1 }]}>
          <View style={styles.toggleTextWrap}>
            <Text style={[styles.toggleTitle, { color: colors.ink }]}>
              Vibrate on button press
            </Text>
            <Text style={[styles.toggleSub, { color: colors.mute }]}>
              Feel each remote key
            </Text>
          </View>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={(val) => onUpdateSetting('hapticFeedback', val)}
            trackColor={{ false: colors.key2, true: colors.acc }}
            thumbColor={Platform.OS === 'android' ? colors.card : undefined}
          />
        </View>
      </View>

      {/* 6. Server & Cloud Backend Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              Server & Cloud Backend
            </Text>
            <Text style={[styles.caption, { color: colors.mute, marginTop: 2 }]}>
              {serverConfig?.isCloud ? 'Cloud Deployment Mode' : 'Local Gateway Mode'}
            </Text>
          </View>
          <View style={[styles.serverModeBadge, { backgroundColor: colors.key2 }]}>
            <Text style={[styles.serverModeText, { color: colors.ink }]}>
              {serverConfig?.isSecure ? '🔒 WSS / HTTPS' : '⚡ WS / HTTP'}
            </Text>
          </View>
        </View>

        {/* Server Endpoint Details */}
        <View style={[styles.endpointBox, { backgroundColor: colors.key2 }]}>
          <View style={styles.endpointRow}>
            <Text style={[styles.endpointLabel, { color: colors.mute }]}>Host:</Text>
            <Text style={[styles.endpointVal, { color: colors.ink }]} numberOfLines={1}>
              {serverConfig?.hostDisplay || backendHost}
            </Text>
          </View>
          <View style={styles.endpointRow}>
            <Text style={[styles.endpointLabel, { color: colors.mute }]}>Latency:</Text>
            <Text style={[styles.endpointVal, { color: isSocketConnected ? colors.ok : colors.red }]}>
              {isSocketConnected ? (serverLatency > 0 ? `${serverLatency} ms` : 'Active') : 'Disconnected'}
            </Text>
          </View>
          <View style={styles.endpointRow}>
            <Text style={[styles.endpointLabel, { color: colors.mute }]}>Real-Time WS:</Text>
            <Text style={[styles.endpointVal, { color: colors.ink }]} numberOfLines={1}>
              {serverConfig?.wsUrl || `ws://${backendHost}:3000/ws`}
            </Text>
          </View>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: colors.key2 }]}
            activeOpacity={0.7}
            onPress={() => {
              setHostInput('localhost');
              if (onUpdateBackendHost) onUpdateBackendHost('localhost');
            }}
          >
            <Text style={[styles.presetText, { color: colors.ink }]}>🏠 Localhost</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: colors.key2 }]}
            activeOpacity={0.7}
            onPress={() => {
              setHostInput('https://zapp-remote.up.railway.app');
              if (onUpdateBackendHost) onUpdateBackendHost('https://zapp-remote.up.railway.app');
            }}
          >
            <Text style={[styles.presetText, { color: colors.ink }]}>☁️ Cloud Host</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: colors.key2 }]}
            activeOpacity={0.7}
            onPress={() => setShowHostInput((prev) => !prev)}
          >
            <Text style={[styles.presetText, { color: colors.acc }]}>
              {showHostInput ? 'Hide' : 'Custom'}
            </Text>
          </TouchableOpacity>
        </View>

        {showHostInput && (
          <View style={[styles.ipRow, { marginTop: 10 }]}>
            <TextInput
              style={[
                styles.ipInput,
                { backgroundColor: colors.key2, color: colors.ink },
              ]}
              value={hostInput}
              onChangeText={setHostInput}
              placeholder="e.g. https://api.zapp.app or 192.168.1.100"
              placeholderTextColor={colors.mute}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.ipGoBtn, { backgroundColor: colors.acc }]}
              activeOpacity={0.8}
              onPress={handleHostSave}
            >
              <Text style={[styles.ipGoText, { color: colors.accink }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {serverConfig?.isCloud && (
          <View style={[styles.cloudInfoBox, { backgroundColor: colors.key2 }]}>
            <Text style={[styles.cloudInfoText, { color: colors.mute }]}>
              💡 <Text style={{ fontWeight: '700', color: colors.ink }}>Cloud Mode:</Text> Device state, pairing keys, and camera streams sync via secure WSS across all phones. For TV control, keep phone and TV on the same home Wi-Fi network.
            </Text>
          </View>
        )}
      </View>

      {/* 6. FAQ Accordion */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 4 }]}>
          Can't connect?
        </Text>

        <TouchableOpacity
          style={styles.faqItem}
          activeOpacity={0.7}
          onPress={() => toggleFaq('faq1')}
        >
          <Text style={[styles.faqSummary, { color: colors.ink }]}>
            {faqExpanded.faq1 ? '▼ ' : '▶ '}My TV isn't listed
          </Text>
          {faqExpanded.faq1 && (
            <Text style={[styles.faqAnswer, { color: colors.mute }]}>
              Turn the TV on and make sure both devices use the same Wi-Fi, not a guest network.
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.faqItem, { borderTopColor: colors.key2, borderTopWidth: 1 }]}
          activeOpacity={0.7}
          onPress={() => toggleFaq('faq2')}
        >
          <Text style={[styles.faqSummary, { color: colors.ink }]}>
            {faqExpanded.faq2 ? '▼ ' : '▶ '}No pairing code on the TV
          </Text>
          {faqExpanded.faq2 && (
            <Text style={[styles.faqAnswer, { color: colors.mute }]}>
              Restart the TV and scan again. The code shows for about a minute.
            </Text>
          )}
        </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  serverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 22,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  statusSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  discBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discText: {
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 12,
    minHeight: 58,
  },
  tvIcon: {
    width: 36,
    height: 26,
    borderWidth: 2.5,
    borderRadius: 6,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
  },
  deviceSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeWrap: {
    paddingLeft: 6,
  },
  tag: {
    fontSize: 13,
    fontWeight: '700',
  },
  ipRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginVertical: 4,
  },
  ipInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    fontSize: 15,
  },
  ipGoBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipGoText: {
    fontSize: 15,
    fontWeight: '700',
  },
  errText: {
    fontSize: 13,
    marginTop: 4,
  },
  cameraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cameraIcon: {
    fontSize: 22,
  },
  cameraTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cameraSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cameraArrow: {
    fontSize: 13,
    fontWeight: '700',
  },
  savedActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 13,
    marginTop: 2,
  },
  faqItem: {
    paddingVertical: 10,
  },
  faqSummary: {
    fontSize: 14,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  serverModeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serverModeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  endpointBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  endpointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpointLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  endpointVal: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '70%',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cloudInfoBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  cloudInfoText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
