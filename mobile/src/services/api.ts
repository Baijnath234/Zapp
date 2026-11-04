import { DiscoveredTv, SavedTv, TvSettings, TvState } from '../types/tv';

let BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/tv';

export function setApiHost(host: string, port = 3000) {
  BASE_URL = `http://${host}:${port}/api/tv`;
}

export const tvApi = {
  async getStatus(): Promise<TvState> {
    const res = await fetch(`${BASE_URL}/status`);
    const json = await res.json();
    return json.data;
  },

  async discoverNearby(): Promise<DiscoveredTv[]> {
    const res = await fetch(`${BASE_URL}/discover`);
    const json = await res.json();
    return json.data;
  },

  async getDiscovered(): Promise<DiscoveredTv[]> {
    const res = await fetch(`${BASE_URL}/discovered`);
    const json = await res.json();
    return json.data;
  },

  async getSaved(): Promise<SavedTv[]> {
    const res = await fetch(`${BASE_URL}/saved`);
    const json = await res.json();
    return json.data;
  },

  async connect(ip: string, name?: string, model?: string): Promise<TvState> {
    const res = await fetch(`${BASE_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, name, model }),
    });
    const json = await res.json();
    return json.data;
  },

  async pair(code: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    return json.success;
  },

  async sendKey(key: string, direction: 'SHORT' | 'START_LONG' | 'END_LONG' = 'SHORT'): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, direction }),
    });
    const json = await res.json();
    return json.success;
  },

  async sendPower(): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/power`, {
      method: 'POST',
    });
    const json = await res.json();
    return json.success;
  },

  async launchApp(appLink: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appLink }),
    });
    const json = await res.json();
    return json.success;
  },

  async disconnect(): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/disconnect`, {
      method: 'POST',
    });
    const json = await res.json();
    return json.success;
  },

  async forgetTv(ip: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/saved/${ip}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.success;
  },

  async getSettings(): Promise<TvSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<TvSettings>): Promise<TvSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    return json.data;
  },
};
