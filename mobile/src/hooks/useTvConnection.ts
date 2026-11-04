import { useState, useEffect, useCallback, useRef } from 'react';
import { tvSocket } from '../services/socket';
import { tvApi, setApiHost } from '../services/api';
import { mobileStorage } from '../services/storage';
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
  const [backendHost, setBackendHostState] = useState('localhost');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
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

  // 1. Load persistent local storage on boot
  useEffect(() => {
    async function loadInitialStorage() {
      const [storedTvs, storedSettings, cachedState, storedHost] = await Promise.all([
        mobileStorage.getSavedTvs(),
        mobileStorage.getSettings(),
        mobileStorage.getCachedTvState(),
        mobileStorage.getBackendHost(),
      ]);

      if (storedTvs && storedTvs.length > 0) {
        setSavedTvs(storedTvs);
      }
      if (storedSettings) {
        setSettings(storedSettings);
      }
      if (cachedState) {
        setTvState(cachedState);
      }
      if (storedHost && storedHost !== 'localhost') {
        setBackendHostState(storedHost);
        setApiHost(storedHost);
        tvSocket.setServerUrl(storedHost);
      }
    }

    loadInitialStorage();
  }, []);

  // 2. Real-time WebSocket synchronization
  useEffect(() => {
    tvSocket.connect();

    const unsubscribe = tvSocket.subscribe((event, data) => {
      switch (event) {
        case 'socket_status':
          setIsSocketConnected(!!data.connected);
          break;

        case 'init_state':
          if (data.state) {
            setTvState(data.state);
            mobileStorage.setCachedTvState(data.state);
          }
          if (data.discovered && data.discovered.length) {
            setDiscoveredTvs(data.discovered);
          }
          if (data.saved) {
            setSavedTvs(data.saved);
            mobileStorage.setSavedTvs(data.saved);
          }
          if (data.settings) {
            setSettings(data.settings);
            mobileStorage.setSettings(data.settings);
          }
          break;

        case 'tv_state':
        case 'connected':
          setTvState(data);
          mobileStorage.setCachedTvState(data);
          if (data.connected && data.name) {
            showToast(`Connected to ${data.name}`);
            setPendingPairTv(null);
            if (data.ip) mobileStorage.setLastTvIp(data.ip);
          }
          break;

        case 'pair_requested':
          setPendingPairTv({ name: data.name || 'Android TV', ip: data.ip });
          break;

        case 'disconnected':
          setTvState((prev) => {
            const next = {
              ...prev,
              connected: false,
              pairingRequired: false,
              ip: null,
              name: null,
            };
            mobileStorage.setCachedTvState(next);
            return next;
          });
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
          mobileStorage.setSavedTvs(data);
          break;

        case 'scanning':
          setIsScanning(!!data.isScanning);
          break;

        case 'settings_updated':
          setSettings(data);
          mobileStorage.setSettings(data);
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

  const updateBackendHost = useCallback((host: string) => {
    const cleanHost = host.trim();
    setBackendHostState(cleanHost);
    mobileStorage.setBackendHost(cleanHost);
    setApiHost(cleanHost);
    tvSocket.setServerUrl(cleanHost);
    showToast(`Backend set to ${cleanHost}`);
  }, [showToast]);

  const scan = useCallback(() => {
    setIsScanning(true);
    const sent = tvSocket.send('scan');
    if (!sent) {
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
        setPendingPairTv({ name: tv.name || 'Android TV', ip: tv.ip });
      }

      mobileStorage.setLastTvIp(tv.ip);

      const sent = tvSocket.send('connect', tv);
      if (!sent) {
        tvApi
          .connect(tv.ip, tv.name, tv.model)
          .then((state) => {
            setTvState(state);
            mobileStorage.setCachedTvState(state);
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
      mobileStorage.setLastTvIp(ip);
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
              const updatedList = [
                ...savedTvs.filter((s) => s.ip !== pendingPairTv.ip),
                { ip: pendingPairTv.ip, name: pendingPairTv.name, model: 'Android TV' },
              ];
              setSavedTvs(updatedList);
              mobileStorage.setSavedTvs(updatedList);
              mobileStorage.setLastTvIp(pendingPairTv.ip);
              setPendingPairTv(null);
              showToast(`Connected to ${pendingPairTv.name}`);
            }
          })
          .catch((err) => {
            showToast(err.message || 'Pairing failed');
          });
      } else {
        const updatedList = [
          ...savedTvs.filter((s) => s.ip !== pendingPairTv.ip),
          { ip: pendingPairTv.ip, name: pendingPairTv.name, model: 'Android TV' },
        ];
        setSavedTvs(updatedList);
        mobileStorage.setSavedTvs(updatedList);
        mobileStorage.setLastTvIp(pendingPairTv.ip);
        setPendingPairTv(null);
      }
    },
    [pendingPairTv, savedTvs, showToast],
  );

  const cancelPair = useCallback(() => {
    setPendingPairTv(null);
  }, []);

  const disconnect = useCallback(() => {
    tvSocket.send('disconnect');
    setTvState((prev) => {
      const next = {
        ...prev,
        connected: false,
        ip: null,
        name: null,
      };
      mobileStorage.setCachedTvState(next);
      return next;
    });
    showToast('Disconnected');
  }, [showToast]);

  const forgetTv = useCallback(
    (ip: string) => {
      tvSocket.send('forget', { ip });
      setSavedTvs((prev) => {
        const next = prev.filter((s) => s.ip !== ip);
        mobileStorage.setSavedTvs(next);
        return next;
      });
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

  const sendText = useCallback((text: string) => {
    tvSocket.send('text', { text });
  }, []);

  const sendWake = useCallback((mac: string) => {
    tvSocket.send('wake', { mac });
  }, []);

  const updateSetting = useCallback((key: keyof TvSettings, value: boolean) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      mobileStorage.setSettings(updated);
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
    sendWake,
    updateSetting,
    updateBackendHost,
  };
}
