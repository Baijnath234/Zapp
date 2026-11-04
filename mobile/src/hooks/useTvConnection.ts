import { useState, useEffect, useCallback, useRef } from 'react';
import { tvSocket } from '../services/socket';
import { tvApi } from '../services/api';
import { DiscoveredTv, SavedTv, TvSettings, TvState, RemoteKey } from '../types/tv';

const DEFAULT_NEAR: DiscoveredTv[] = [
  { id: '1', name: 'Living Room TV', model: 'Sony BRAVIA 4K', ip: '192.168.1.24', port: 6467, isPaired: false },
  { id: '2', name: 'Bedroom TV', model: 'TCL 5-Series', ip: '192.168.1.37', port: 6467, isPaired: false },
  { id: '3', name: 'NVIDIA SHIELD', model: 'Android TV box', ip: '192.168.1.41', port: 6467, isPaired: false },
];

export function useTvConnection() {
  const [tvState, setTvState] = useState<TvState>({
    connected: false,
    pairingRequired: false,
    ip: null,
    name: null,
    model: null,
    powered: true,
    volume: { level: 30, maximum: 100, muted: false },
    currentApp: null,
    activeInput: 'Home',
  });

  const [discoveredTvs, setDiscoveredTvs] = useState<DiscoveredTv[]>(DEFAULT_NEAR);
  const [savedTvs, setSavedTvs] = useState<SavedTv[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [settings, setSettings] = useState<TvSettings>({
    autoReconnect: true,
    wakeOnConnect: false,
    hapticFeedback: true,
  });

  const [pendingPairTv, setPendingPairTv] = useState<{ name: string; ip: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // Sync with backend WebSocket
  useEffect(() => {
    tvSocket.connect();

    const unsubscribe = tvSocket.subscribe((event, data) => {
      switch (event) {
        case 'init_state':
          if (data.state) setTvState(data.state);
          if (data.discovered && data.discovered.length) setDiscoveredTvs(data.discovered);
          if (data.saved) setSavedTvs(data.saved);
          if (data.settings) setSettings(data.settings);
          break;

        case 'tv_state':
        case 'connected':
          setTvState(data);
          if (data.connected && data.name) {
            showToast(`Connected to ${data.name}`);
            setPendingPairTv(null);
          }
          break;

        case 'pair_requested':
          setPendingPairTv({ name: data.name || 'Android TV', ip: data.ip });
          break;

        case 'disconnected':
          setTvState((prev) => ({
            ...prev,
            connected: false,
            pairingRequired: false,
            ip: null,
            name: null,
          }));
          showToast('Disconnected');
          break;

        case 'tv_discovered':
          setDiscoveredTvs((prev) => {
            const idx = prev.findIndex((t) => t.ip === data.ip);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = data;
              return copy;
            }
            return [...prev, data];
          });
          break;

        case 'discovery_list':
          setDiscoveredTvs(data);
          break;

        case 'saved_list':
          setSavedTvs(data);
          break;

        case 'scanning':
          setIsScanning(!!data.isScanning);
          break;

        case 'settings_updated':
          setSettings(data);
          break;

        case 'error':
          showToast(data.message || 'An error occurred');
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [showToast]);

  const scan = useCallback(() => {
    setIsScanning(true);
    const sent = tvSocket.send('scan');
    if (!sent) {
      // Fallback via REST or simulated scan
      tvApi
        .discoverNearby()
        .then((devices) => {
          setDiscoveredTvs(devices);
          setIsScanning(false);
        })
        .catch(() => {
          setTimeout(() => {
            setIsScanning(false);
          }, 1500);
        });
    }
  }, []);

  const connect = useCallback(
    (tv: { ip: string; name?: string; model?: string }) => {
      const isSaved = savedTvs.some((s) => s.ip === tv.ip);

      if (!isSaved) {
        // Open pairing modal
        setPendingPairTv({ name: tv.name || 'Android TV', ip: tv.ip });
      }

      const sent = tvSocket.send('connect', tv);
      if (!sent) {
        tvApi
          .connect(tv.ip, tv.name, tv.model)
          .then((state) => {
            setTvState(state);
            showToast(`Connected to ${tv.name || 'Android TV'}`);
          })
          .catch((err) => {
            showToast(err.message || 'Failed to connect');
          });
      }
    },
    [savedTvs, showToast],
  );

  const connectByIp = useCallback(
    (ip: string) => {
      const target = { ip, name: 'Android TV', model: 'Android TV' };
      setPendingPairTv(target);
      tvSocket.send('connect', target);
    },
    [],
  );

  const pair = useCallback(
    (code: string) => {
      if (!pendingPairTv) return;
      const sent = tvSocket.send('pair', { code: code.toUpperCase() });
      if (!sent) {
        tvApi
          .pair(code.toUpperCase())
          .then((success) => {
            if (success) {
              setSavedTvs((prev) => [
                ...prev.filter((s) => s.ip !== pendingPairTv.ip),
                { ip: pendingPairTv.ip, name: pendingPairTv.name, model: 'Android TV' },
              ]);
              setPendingPairTv(null);
              showToast(`Connected to ${pendingPairTv.name}`);
            }
          })
          .catch((err) => {
            showToast(err.message || 'Pairing failed');
          });
      } else {
        setSavedTvs((prev) => [
          ...prev.filter((s) => s.ip !== pendingPairTv.ip),
          { ip: pendingPairTv.ip, name: pendingPairTv.name, model: 'Android TV' },
        ]);
        setPendingPairTv(null);
      }
    },
    [pendingPairTv, showToast],
  );

  const cancelPair = useCallback(() => {
    setPendingPairTv(null);
  }, []);

  const disconnect = useCallback(() => {
    tvSocket.send('disconnect');
    setTvState((prev) => ({
      ...prev,
      connected: false,
      ip: null,
      name: null,
    }));
    showToast('Disconnected');
  }, [showToast]);

  const forgetTv = useCallback(
    (ip: string) => {
      tvSocket.send('forget', { ip });
      setSavedTvs((prev) => prev.filter((s) => s.ip !== ip));
      if (tvState.ip === ip) {
        disconnect();
      }
      showToast('TV forgotten');
    },
    [tvState.ip, disconnect, showToast],
  );

  const sendKey = useCallback((key: RemoteKey) => {
    tvSocket.send('key', { key, direction: 'SHORT' });
  }, []);

  const sendPower = useCallback(() => {
    tvSocket.send('power');
  }, []);

  const sendAppLink = useCallback((url: string) => {
    tvSocket.send('app', { appLink: url });
  }, []);

  const updateSetting = useCallback((key: keyof TvSettings, value: boolean) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      tvSocket.send('update_settings', updated);
      return updated;
    });
  }, []);

  return {
    tvState,
    setTvState,
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
  };
}

