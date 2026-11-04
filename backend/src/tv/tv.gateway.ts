import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';
import { TvService } from './tv.service';
import { ConnectTvDto, PairTvDto, SendKeyDto, LaunchAppDto, TvSettingsDto } from './dto/tv.dto';
import { Subscription } from 'rxjs';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
export class TvGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TvGateway.name);
  private eventSub: Subscription | null = null;
  private clients = new Set<WebSocket>();

  @WebSocketServer()
  server: Server;

  constructor(private readonly tvService: TvService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized on path /ws');

    // Subscribe to TV events and broadcast to all connected WebSocket clients
    this.eventSub = this.tvService.eventStream$.subscribe(({ event, data }) => {
      this.broadcast(event, data);
    });
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    this.clients.add(client);
    this.logger.log(`Client connected via WebSocket. Active clients: ${this.clients.size}`);

    // Immediately send current state and discovered TVs to newly connected client
    const currentState = this.tvService.getState();
    const discovered = this.tvService.getDiscoveredTvs();
    const saved = this.tvService.getSavedTvs();
    const settings = this.tvService.getSettings();

    this.sendToClient(client, 'init_state', {
      state: currentState,
      discovered,
      saved,
      settings,
    });
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
    this.logger.log(`Client disconnected from WebSocket. Active clients: ${this.clients.size}`);
  }

  private sendToClient(client: WebSocket, event: string, data: any) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({ event, data }));
      } catch (err) {
        this.logger.error('Failed to send message to client', err);
      }
    }
  }

  private broadcast(event: string, data: any) {
    const payload = JSON.stringify({ event, data });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err) {
          this.logger.error('Failed to broadcast to client', err);
        }
      }
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: WebSocket): void {
    this.sendToClient(client, 'pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('get_network_devices')
  handleGetNetworkDevices(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { clientIp?: string },
  ): void {
    const devices = this.tvService.getNetworkDevices(data?.clientIp);
    this.sendToClient(client, 'network_devices', devices);
  }

  @SubscribeMessage('scan')
  async handleScan(): Promise<void> {
    this.broadcast('scanning', { isScanning: true });
    const discovered = await this.tvService.scanNearby();
    this.broadcast('discovery_list', discovered);
    this.broadcast('scanning', { isScanning: false });
  }

  @SubscribeMessage('connect')
  async handleConnect(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: ConnectTvDto,
  ): Promise<void> {
    this.logger.log(`WebSocket request: connect to ${data.ip}`);
    try {
      const state = await this.tvService.connectTv(data);
      this.broadcast('tv_state', state);
    } catch (err: any) {
      this.sendToClient(client, 'error', { message: err?.message || 'Failed to connect' });
    }
  }

  @SubscribeMessage('pair')
  handlePair(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: PairTvDto,
  ): void {
    this.logger.log(`WebSocket request: pair code ${data.code}`);
    try {
      this.tvService.pairTv(data);
    } catch (err: any) {
      this.sendToClient(client, 'error', { message: err?.message || 'Invalid pair code' });
    }
  }

  @SubscribeMessage('key')
  handleKey(@MessageBody() data: SendKeyDto): void {
    this.tvService.sendKey(data);
  }

  @SubscribeMessage('text')
  handleText(@MessageBody() data: { text: string }): void {
    this.tvService.sendText(data.text);
  }

  @SubscribeMessage('wake')
  async handleWake(@MessageBody() data: { mac: string }): Promise<void> {
    await this.tvService.sendWakeOnLan(data.mac);
  }

  @SubscribeMessage('power')
  handlePower(): void {
    this.tvService.sendPower();
  }

  @SubscribeMessage('app')
  handleApp(@MessageBody() data: LaunchAppDto): void {
    this.tvService.launchApp(data.appLink);
  }

  @SubscribeMessage('disconnect')
  handleDisconnectCommand(): void {
    this.tvService.disconnectTv();
  }

  @SubscribeMessage('forget')
  async handleForget(@MessageBody() data: { ip: string }): Promise<void> {
    await this.tvService.forgetTv(data.ip);
    this.broadcast('saved_list', this.tvService.getSavedTvs());
  }

  @SubscribeMessage('update_settings')
  async handleUpdateSettings(@MessageBody() data: TvSettingsDto): Promise<void> {
    const updated = await this.tvService.updateSettings(data);
    this.broadcast('settings_updated', updated);
  }
}
