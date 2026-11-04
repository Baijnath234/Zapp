import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ThemeColors } from '../theme/colors';
import { NetworkDevice, TvState } from '../types/tv';
import { WifiInfo } from '../hooks/useWifiNetwork';

interface WifiDevicesScreenProps {
  colors: ThemeColors;
  wifiInfo: WifiInfo;
  networkDevices: NetworkDevice[];
  isScanning: boolean;
  tvState: TvState;
  onRefresh: () => void;
  onConnectTv: (tv: { ip: string; name?: string; model?: string }) => void;
  onGoToRemote: () => void;
  onOpenCamera?: () => void;
}

export const WifiDevicesScreen: React.FC<WifiDevicesScreenProps> = ({
  colors,
  wifiInfo,
  networkDevices,
  isScanning,
  tvState,
  onRefresh,
  onConnectTv,
  onGoToRemote,
  onOpenCamera,
}) => {
  const getDeviceIconText = (type: string) => {
    switch (type) {
      case 'phone':
        return '📱';
      case 'router':
        return '📶';
      case 'server':
        return '🖥️';
      case 'tv':
      default:
        return '📺';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title & Refresh */}
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.ink }]}>Wi-Fi Network</Text>
          <Text style={[styles.pageSub, { color: colors.mute }]}>
            {wifiInfo.ipAddress ? `IP: ${wifiInfo.ipAddress}` : 'Checking Wi-Fi…'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: colors.key2 }]}
          activeOpacity={0.7}
          onPress={onRefresh}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color={colors.acc} />
          ) : (
            <Text style={[styles.scanBtnText, { color: colors.ink }]}>Scan Wi-Fi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 1. Mobile Phone Connection Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <View style={styles.deviceRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.key2 }]}>
            <Text style={styles.emojiIcon}>📱</Text>
          </View>
          <View style={styles.deviceInfo}>
            <View style={styles.nameBadgeRow}>
              <Text style={[styles.deviceName, { color: colors.ink }]}>Your Mobile Phone</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.ok + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.ok }]}>Active Wi-Fi</Text>
              </View>
            </View>
            <Text style={[styles.deviceDetail, { color: colors.mute }]}>
              IP: {wifiInfo.ipAddress || '192.168.1.105'} · Subnet: {wifiInfo.subnet}
            </Text>
          </View>
        </View>

        {onOpenCamera && (
          <TouchableOpacity
            style={[styles.cameraActionBtn, { backgroundColor: colors.key2 }]}
            activeOpacity={0.7}
            onPress={onOpenCamera}
          >
            <Text style={styles.cameraEmoji}>📷</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cameraBtnTitle, { color: colors.ink }]}>
                Access Camera with Wi-Fi
              </Text>
              <Text style={[styles.cameraBtnSub, { color: colors.mute }]}>
                Scan TV pairing codes or stream camera to TV
              </Text>
            </View>
            <Text style={[styles.cameraArrow, { color: colors.acc }]}>Open →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Backend & Docker PostgreSQL Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <View style={styles.deviceRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.key2 }]}>
            <Text style={styles.emojiIcon}>🖥️</Text>
          </View>
          <View style={styles.deviceInfo}>
            <View style={styles.nameBadgeRow}>
              <Text style={[styles.deviceName, { color: colors.ink }]}>Zapp Backend & DB</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.acc + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.acc }]}>Docker Ready</Text>
              </View>
            </View>
            <Text style={[styles.deviceDetail, { color: colors.mute }]}>
              NestJS (ws://:3000) · PostgreSQL (Port 5433)
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Devices Connected on this Wi-Fi */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            Devices Connected to Wi-Fi ({networkDevices.length})
          </Text>
          <Text style={[styles.deviceCountText, { color: colors.mute }]}>
            {wifiInfo.subnet}
          </Text>
        </View>

        <View style={styles.deviceList}>
          {networkDevices.map((device) => {
            const isTv = device.type === 'tv';
            const isCurrentConnectedTv = tvState.connected && tvState.ip === device.ip;

            return (
              <View
                key={device.id || device.ip}
                style={[styles.connectedItem, { backgroundColor: colors.key2 }]}
              >
                <View style={[styles.itemIconBox, { backgroundColor: colors.card }]}>
                  <Text style={styles.itemEmoji}>{getDeviceIconText(device.type)}</Text>
                </View>

                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.ink }]}>
                    {device.name}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.mute }]}>
                    {device.ip} {device.model ? `· ${device.model}` : ''}
                  </Text>
                </View>

                <View style={styles.itemAction}>
                  {isCurrentConnectedTv ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.acc }]}
                      activeOpacity={0.8}
                      onPress={onGoToRemote}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.accink }]}>
                        Remote
                      </Text>
                    </TouchableOpacity>
                  ) : isTv ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.card }]}
                      activeOpacity={0.8}
                      onPress={() => onConnectTv({ ip: device.ip, name: device.name, model: device.model })}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.ink }]}>
                        Connect
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: colors.card }]}>
                      <Text style={[styles.statusBadgeText, { color: colors.mute }]}>
                        Online
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. Network Details Card */}
      <View style={[styles.card, { backgroundColor: colors.card }, colors.sh]}>
        <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 8 }]}>
          Network Diagnostics
        </Text>
        <View style={styles.diagRow}>
          <Text style={[styles.diagLabel, { color: colors.mute }]}>Gateway Router:</Text>
          <Text style={[styles.diagValue, { color: colors.ink }]}>{wifiInfo.gateway}</Text>
        </View>
        <View style={[styles.diagRow, { borderTopWidth: 1, borderTopColor: colors.key2 }]}>
          <Text style={[styles.diagLabel, { color: colors.mute }]}>Subnet Range:</Text>
          <Text style={[styles.diagValue, { color: colors.ink }]}>{wifiInfo.subnet}</Text>
        </View>
        <View style={[styles.diagRow, { borderTopWidth: 1, borderTopColor: colors.key2 }]}>
          <Text style={[styles.diagLabel, { color: colors.mute }]}>Auto-Connect:</Text>
          <Text style={[styles.diagValue, { color: colors.ok }]}>Enabled on Wi-Fi</Text>
        </View>
        <View style={[styles.diagRow, { borderTopWidth: 1, borderTopColor: colors.key2 }]}>
          <Text style={[styles.diagLabel, { color: colors.mute }]}>Discovery Protocol:</Text>
          <Text style={[styles.diagValue, { color: colors.acc }]}>mDNS / Zeroconf Active</Text>
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
  pageSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  scanBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    borderRadius: 22,
    padding: 16,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
  },
  deviceDetail: {
    fontSize: 12,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cameraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  cameraEmoji: {
    fontSize: 22,
  },
  cameraBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cameraBtnSub: {
    fontSize: 12,
    marginTop: 2,
  },
  cameraArrow: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  deviceCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deviceList: {
    gap: 8,
  },
  connectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 12,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 18,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  itemAction: {
    marginLeft: 6,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  diagLabel: {
    fontSize: 13,
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});

