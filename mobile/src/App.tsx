import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from './theme/colors';
import { ViewType } from './types/tv';
import { useTvConnection } from './hooks/useTvConnection';
import { useWifiNetwork } from './hooks/useWifiNetwork';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { ConnectionScreen } from './screens/ConnectionScreen';
import { RemoteScreen } from './screens/RemoteScreen';
import { WifiDevicesScreen } from './screens/WifiDevicesScreen';
import { CameraWifiScreen } from './screens/CameraWifiScreen';
import { BottomNav } from './components/BottomNav';
import { PairModal } from './components/PairModal';
import { Toast } from './components/Toast';

function MainApp() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? theme.dark : theme.light;
  const insets = useSafeAreaInsets();

  const [currentView, setCurrentView] = useState<ViewType>('welcome');

  const {
    tvState,
    discoveredTvs,
    savedTvs,
    isScanning,
    backendHost,
    isSocketConnected,
    settings,
    pendingPairTv,
    toastMessage,
    showToast,
    scan,
    connect,
    connectByIp,
    pair,
    cancelPair,
    disconnect,
    forgetTv,
    sendKey,
    sendPower,
    sendAppLink,
    sendText,
    updateSetting,
    updateBackendHost,
  } = useTvConnection();

  const {
    wifiInfo,
    networkDevices,
    isScanningWifi,
    refreshWifiDevices,
  } = useWifiNetwork(tvState, savedTvs, settings, connect, showToast);

  const handleGetStarted = () => {
    if (tvState.connected) {
      setCurrentView('remote');
    } else {
      setCurrentView('wifi');
    }
  };

  const handlePairSubmit = (code: string) => {
    pair(code);
    setCurrentView('remote');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={currentView === 'camera' ? 'light' : colorScheme === 'dark' ? 'light' : 'dark'} />

      <SafeAreaView
        style={[
          styles.safeArea,
          currentView !== 'camera' && { paddingTop: insets.top },
        ]}
      >
        {/* Screen Views */}
        {currentView === 'welcome' && (
          <WelcomeScreen
            colors={colors}
            onGetStarted={handleGetStarted}
            savedTvs={savedTvs}
            settings={settings}
            connect={connect}
          />
        )}

        {currentView === 'connect' && (
          <ConnectionScreen
            colors={colors}
            tvState={tvState}
            discoveredTvs={discoveredTvs}
            savedTvs={savedTvs}
            isScanning={isScanning}
            settings={settings}
            backendHost={backendHost}
            isSocketConnected={isSocketConnected}
            onScan={scan}
            onConnect={(tv) => {
              connect(tv);
              if (savedTvs.some((s) => s.ip === tv.ip)) {
                setCurrentView('remote');
              }
            }}
            onConnectIp={connectByIp}
            onDisconnect={disconnect}
            onForgetTv={forgetTv}
            onUpdateSetting={updateSetting}
            onUpdateBackendHost={updateBackendHost}
            onOpenCamera={() => setCurrentView('camera')}
          />
        )}

        {currentView === 'remote' && (
          <RemoteScreen
            colors={colors}
            tvState={tvState}
            onSendKey={sendKey}
            onSendPower={sendPower}
            onSendAppLink={sendAppLink}
            onSendText={sendText}
            onGoToConnect={() => setCurrentView('connect')}
            hapticEnabled={settings.hapticFeedback}
            showToast={showToast}
          />
        )}

        {currentView === 'wifi' && (
          <WifiDevicesScreen
            colors={colors}
            wifiInfo={wifiInfo}
            networkDevices={networkDevices}
            isScanning={isScanningWifi}
            tvState={tvState}
            onRefresh={refreshWifiDevices}
            onConnectTv={(tv) => {
              connect(tv);
              if (savedTvs.some((s) => s.ip === tv.ip)) {
                setCurrentView('remote');
              }
            }}
            onGoToRemote={() => setCurrentView('remote')}
            onOpenCamera={() => setCurrentView('camera')}
          />
        )}

        {currentView === 'camera' && (
          <CameraWifiScreen
            colors={colors}
            wifiInfo={wifiInfo}
            tvState={tvState}
            onConnectIp={(ip) => {
              connectByIp(ip);
              setCurrentView('remote');
            }}
            onPairTv={(code) => {
              pair(code);
              setCurrentView('remote');
            }}
            onSendAppLink={sendAppLink}
            onClose={() => setCurrentView('wifi')}
            showToast={showToast}
            hapticEnabled={settings.hapticFeedback}
          />
        )}
      </SafeAreaView>

      {/* Persistent Bottom Tab Navigation (Shown on Remote, Connect, Wi-Fi & Camera) */}
      {currentView !== 'welcome' && currentView !== 'camera' && (
        <BottomNav
          colors={colors}
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          insetBottom={insets.bottom}
        />
      )}

      {/* Pairing PIN Code Modal */}
      <PairModal
        colors={colors}
        visible={pendingPairTv !== null}
        tvName={pendingPairTv?.name || 'Android TV'}
        onPair={handlePairSubmit}
        onCancel={cancelPair}
      />

      {/* Toast Notification */}
      <Toast colors={colors} message={toastMessage} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
