import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedTv, TvSettings, TvState } from '../types/tv';

const KEYS = {
  SAVED_TVS: '@zapp_saved_tvs',
  SETTINGS: '@zapp_settings',
  LAST_TV_IP: '@zapp_last_tv_ip',
  BACKEND_HOST: '@zapp_backend_host',
  CACHED_STATE: '@zapp_cached_state',
};

const DEFAULT_SETTINGS: TvSettings = {
  autoReconnect: true,
  wakeOnConnect: false,
  hapticFeedback: true,
};

export const mobileStorage = {
  async getSavedTvs(): Promise<SavedTv[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_TVS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async setSavedTvs(tvs: SavedTv[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SAVED_TVS, JSON.stringify(tvs));
    } catch (e) {
      // ignore
    }
  },

  async getSettings(): Promise<TvSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  async setSettings(settings: TvSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  },

  async getLastTvIp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.LAST_TV_IP);
    } catch (e) {
      return null;
    }
  },

  async setLastTvIp(ip: string | null): Promise<void> {
    try {
      if (ip) {
        await AsyncStorage.setItem(KEYS.LAST_TV_IP, ip);
      } else {
        await AsyncStorage.removeItem(KEYS.LAST_TV_IP);
      }
    } catch (e) {
      // ignore
    }
  },

  async getBackendHost(): Promise<string> {
    try {
      const host = await AsyncStorage.getItem(KEYS.BACKEND_HOST);
      return host || 'localhost';
    } catch (e) {
      return 'localhost';
    }
  },

  async setBackendHost(host: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.BACKEND_HOST, host);
    } catch (e) {
      // ignore
    }
  },

  async getCachedTvState(): Promise<TvState | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CACHED_STATE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  async setCachedTvState(state: TvState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CACHED_STATE, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  },
};

