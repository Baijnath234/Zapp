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
import { WelcomeScreen } from './screens/WelcomeScreen';
import { ConnectionScreen } from './screens/ConnectionScreen';
import { RemoteScreen } from './screens/RemoteScreen';
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
    updateSetting,
  } = useTvConnection();

  const handleGetStarted = () => {
    if (tvState.connected) {
      setCurrentView('remote');
    } else {
      setCurrentView('connect');
    }
  };

  const handlePairSubmit = (code: string) => {
    pair(code);
    setCurrentView('remote');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
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
          />
        )}

        {currentView === 'remote' && (
          <RemoteScreen
            colors={colors}
            tvState={tvState}
            onSendKey={sendKey}
            onSendPower={sendPower}
            onSendAppLink={sendAppLink}
            onGoToConnect={() => setCurrentView('connect')}
            hapticEnabled={settings.hapticFeedback}
            showToast={showToast}
          />
        )}
      </SafeAreaView>

      {/* Persistent Bottom Tab Navigation (Only shown on Connect & Remote screens) */}
      {currentView !== 'welcome' && (
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

