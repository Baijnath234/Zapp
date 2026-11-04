import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Matches } from 'class-validator';

export class ConnectTvDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/, {
    message: 'Must be a valid IPv4 address (e.g. 192.168.1.50)',
  })
  ip: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class PairTvDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9a-fA-F]{6}$/, {
    message: 'Pairing code must be 6 hex characters shown on the TV',
  })
  code: string;
}

export class SendKeyDto {
  @IsString()
  @IsNotEmpty()
  key: string; // e.g. "up", "down", "left", "right", "ok", "back", "home", "power", "mute", "volume_up", "volume_down", "channel_up", "channel_down", "source", "0"-"9"

  @IsString()
  @IsOptional()
  direction?: 'SHORT' | 'START_LONG' | 'END_LONG';
}

export class LaunchAppDto {
  @IsString()
  @IsNotEmpty()
  appLink: string; // e.g. "https://www.netflix.com", "https://www.youtube.com"
}

export class TvSettingsDto {
  @IsBoolean()
  @IsOptional()
  autoReconnect?: boolean;

  @IsBoolean()
  @IsOptional()
  wakeOnConnect?: boolean;

  @IsBoolean()
  @IsOptional()
  hapticFeedback?: boolean;
}

export interface DiscoveredTv {
  id: string;
  name: string;
  model: string;
  ip: string;
  port: number;
  isPaired: boolean;
  lastSeen: number;
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: 'phone' | 'tv' | 'router' | 'server' | 'other';
  ip: string;
  model?: string;
  status: 'connected' | 'online' | 'paired';
  isCurrentDevice?: boolean;
  lastSeen: number;
}

export interface SavedTv {
  ip: string;
  name: string;
  model: string;
  certificate?: any;
  pairedAt: number;
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

