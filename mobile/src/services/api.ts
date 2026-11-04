import { DiscoveredTv, SavedTv, TvSettings, TvState, NetworkDevice } from '../types/tv';
import { parseServerConfig, ParsedServerConfig } from './serverConfig';

let currentConfig: ParsedServerConfig = parseServerConfig(
  process.env.EXPO_PUBLIC_API_URL || 'localhost',
);

export function setApiHost(host: string) {
  currentConfig = parseServerConfig(host);
}

export function getServerConfig(): ParsedServerConfig {
  return currentConfig;
}

export const tvApi = {
  async checkHealth(): Promise<{ ok: boolean; latencyMs: number; data?: any }> {
    const start = Date.now();
    try {
      const res = await fetch(currentConfig.healthUrl);
      const data = await res.json();
      return { ok: res.ok, latencyMs: Date.now() - start, data };
    } catch {
      return { ok: false, latencyMs: -1 };
    }
  },

  async getStatus(): Promise<TvState> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/status`);
    const json = await res.json();
    return json.data;
  },

  async discoverNearby(): Promise<DiscoveredTv[]> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/discover`);
    const json = await res.json();
    return json.data;
  },

  async getDiscovered(): Promise<DiscoveredTv[]> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/discovered`);
    const json = await res.json();
    return json.data;
  },

  async getSaved(): Promise<SavedTv[]> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/saved`);
    const json = await res.json();
    return json.data;
  },

  async getNetworkDevices(): Promise<NetworkDevice[]> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/network-devices`);
    const json = await res.json();
    return json.data;
  },

  async connect(ip: string, name?: string, model?: string): Promise<TvState> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, name, model }),
    });
    const json = await res.json();
    return json.data;
  },

  async pair(code: string): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    return json.success;
  },

  async sendKey(key: string, direction: 'SHORT' | 'START_LONG' | 'END_LONG' = 'SHORT'): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, direction }),
    });
    const json = await res.json();
    return json.success;
  },

  async sendText(text: string): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    return json.success;
  },

  async sendWake(mac: string): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/wake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac }),
    });
    const json = await res.json();
    return json.success;
  },

  async sendPower(): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/power`, {
      method: 'POST',
    });
    const json = await res.json();
    return json.success;
  },

  async launchApp(appLink: string): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appLink }),
    });
    const json = await res.json();
    return json.success;
  },

  async disconnect(): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/disconnect`, {
      method: 'POST',
    });
    const json = await res.json();
    return json.success;
  },

  async forgetTv(ip: string): Promise<boolean> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/saved/${ip}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.success;
  },

  async getSettings(): Promise<TvSettings> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/settings`);
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<TvSettings>): Promise<TvSettings> {
    const res = await fetch(`${currentConfig.httpBaseUrl}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    return json.data;
  },
};
