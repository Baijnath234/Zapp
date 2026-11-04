export interface DiscoveredTv {
  id: string;
  name: string;
  model: string;
  ip: string;
  port: number;
  isPaired: boolean;
  lastSeen?: number;
}

export interface SavedTv {
  ip: string;
  name: string;
  model: string;
  pairedAt?: number;
  lastConnected?: number;
}

export interface TvState {
  connected: boolean;
  pairingRequired: boolean;
  ip: string | null;
  name: string | null;
  model: string | null;
  powered: boolean;
  volume: {
    level: number;
    maximum: number;
    muted: boolean;
  };
  currentApp: string | null;
  activeInput: string;
}

export interface TvSettings {
  autoReconnect: boolean;
  wakeOnConnect: boolean;
  hapticFeedback: boolean;
}

export type ViewType = 'welcome' | 'connect' | 'remote';

export type RemoteKey =
  | 'power'
  | 'source'
  | 'mute'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'ok'
  | 'back'
  | 'home'
  | 'vol_up'
  | 'vol_down'
  | 'ch_up'
  | 'ch_down'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'del';

