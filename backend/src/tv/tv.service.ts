import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';
import { StorageService } from './storage.service';
import { DiscoveryService } from './discovery.service';
import { AndroidRemoteAdapter } from './android-remote.adapter';
import { WolService } from './wol.service';
import { ConnectTvDto, DiscoveredTv, PairTvDto, SavedTv, SendKeyDto, TvSettingsDto, TvState } from './dto/tv.dto';

export interface WebSocketEventMessage {
  event: string;
  data: any;
}

@Injectable()
export class TvService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TvService.name);
  private remoteAdapter: AndroidRemoteAdapter;

  public readonly eventStream$ = new Subject<WebSocketEventMessage>();

  constructor(
    private readonly storageService: StorageService,
    private readonly discoveryService: DiscoveryService,
    private readonly wolService: WolService,
  ) {
    this.remoteAdapter = new AndroidRemoteAdapter();
    this.bindRemoteEvents();
  }

  onModuleInit() {
    // Forward discovery events to websocket stream
    this.discoveryService.tvDiscovered$.subscribe((tv) => {
      this.eventStream$.next({
        event: 'tv_discovered',
        data: tv,
      });
    });

    // Handle auto-reconnect if configured
    const settings = this.storageService.getSettings();
    if (settings.autoReconnect) {
      const lastIp = this.storageService.getLastConnectedIp();
      if (lastIp) {
        const saved = this.storageService.getSavedTv(lastIp);
        if (saved) {
          this.logger.log(`Auto-reconnecting to last saved TV: ${saved.name} (${saved.ip})`);
          setTimeout(() => {
            this.connectTv({ ip: saved.ip, name: saved.name, model: saved.model }).catch((err) => {
              this.logger.warn(`Auto-reconnect failed for ${saved.ip}: ${err.message}`);
            });
          }, 1500);
        }
      }
    }
  }

  onModuleDestroy() {
    this.remoteAdapter.disconnect();
  }

  private bindRemoteEvents() {
    this.remoteAdapter.on('secret', () => {
      this.eventStream$.next({
        event: 'pair_requested',
        data: {
          ip: this.remoteAdapter.getState().ip,
          name: this.remoteAdapter.getState().name,
          message: 'Please enter the 6-character PIN shown on your TV screen',
        },
      });
    });

    this.remoteAdapter.on('ready', async (cert: any) => {
      const state = this.remoteAdapter.getState();
      if (state.ip) {
        await this.storageService.saveTv({
          ip: state.ip,
          name: state.name || 'Android TV',
          model: state.model || 'Android TV',
          certificate: cert,
        });
      }

      this.eventStream$.next({
        event: 'connected',
        data: state,
      });

      this.eventStream$.next({
        event: 'tv_state',
        data: state,
      });
    });

    this.remoteAdapter.on('powered', (powered: boolean) => {
      this.eventStream$.next({
        event: 'tv_state',
        data: this.remoteAdapter.getState(),
      });
    });

    this.remoteAdapter.on('volume', (volume: any) => {
      this.eventStream$.next({
        event: 'tv_state',
        data: this.remoteAdapter.getState(),
      });
    });

    this.remoteAdapter.on('current_app', (app: string) => {
      this.eventStream$.next({
        event: 'tv_state',
        data: this.remoteAdapter.getState(),
      });
    });

    this.remoteAdapter.on('disconnected', (reason: string) => {
      this.eventStream$.next({
        event: 'disconnected',
        data: { reason, state: this.remoteAdapter.getState() },
      });
    });

    this.remoteAdapter.on('error', (err: any) => {
      this.eventStream$.next({
        event: 'error',
        data: { message: err?.message || 'Remote error' },
      });
    });
  }

  async connectTv(dto: ConnectTvDto): Promise<TvState> {
    const saved = this.storageService.getSavedTv(dto.ip);
    const cert = saved?.certificate;
    const name = dto.name || saved?.name || 'Android TV';
    const model = dto.model || saved?.model || 'Android TV';
    const mac = dto.macAddress || saved?.macAddress;

    // Wake TV if wakeOnConnect setting is active
    const settings = this.storageService.getSettings();
    if (settings.wakeOnConnect && mac) {
      this.logger.log(`Wake-on-connect enabled: waking ${name} (${mac})`);
      await this.wolService.wake(mac);
      await new Promise((r) => setTimeout(r, 800));
    }

    await this.remoteAdapter.connect(dto.ip, name, model, cert);
    return this.remoteAdapter.getState();
  }

  pairTv(dto: PairTvDto): boolean {
    return this.remoteAdapter.sendPairingCode(dto.code);
  }

  sendKey(dto: SendKeyDto): boolean {
    return this.remoteAdapter.sendKey(dto.key, dto.direction);
  }

  sendText(text: string): boolean {
    return this.remoteAdapter.sendText(text);
  }

  sendWakeOnLan(mac: string): Promise<boolean> {
    return this.wolService.wake(mac);
  }

  sendPower(): boolean {
    return this.remoteAdapter.sendPower();
  }

  launchApp(url: string): boolean {
    return this.remoteAdapter.sendAppLink(url);
  }

  disconnectTv(): void {
    this.remoteAdapter.disconnect();
  }

  getState(): TvState {
    return this.remoteAdapter.getState();
  }

  async scanNearby(): Promise<DiscoveredTv[]> {
    return this.discoveryService.startScan(6000);
  }

  getDiscoveredTvs(): DiscoveredTv[] {
    return this.discoveryService.getDiscoveredTvs();
  }

  getNetworkDevices(clientIp?: string) {
    const devices = this.discoveryService.getNetworkDevices(clientIp);
    const state = this.getState();
    // Mark currently connected TV
    return devices.map((d) => {
      if (state.connected && state.ip === d.ip) {
        return { ...d, status: 'connected' as const };
      }
      return d;
    });
  }

  getSavedTvs(): SavedTv[] {
    return this.storageService.getSavedTvs();
  }

  async forgetTv(ip: string): Promise<boolean> {
    const state = this.remoteAdapter.getState();
    if (state.ip === ip) {
      this.disconnectTv();
    }
    return this.storageService.removeSavedTv(ip);
  }

  getSettings(): any {
    return this.storageService.getSettings();
  }

  async updateSettings(dto: TvSettingsDto): Promise<any> {
    return this.storageService.updateSettings(dto);
  }
}
