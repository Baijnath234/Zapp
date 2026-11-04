import { parseServerConfig, ParsedServerConfig } from './serverConfig';

export type SocketListener = (event: string, data: any) => void;

class TvWebSocketClient {
  private ws: WebSocket | null = null;
  private config: ParsedServerConfig = parseServerConfig(
    process.env.EXPO_PUBLIC_WS_URL || 'localhost',
  );
  private listeners: Set<SocketListener> = new Set();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed = false;
  private isConnected = false;
  private lastPingSent = 0;
  private currentLatency = 0;

  constructor() {
    const envUrl = process.env.EXPO_PUBLIC_WS_URL;
    if (envUrl) {
      this.config = parseServerConfig(envUrl);
    }
  }

  setServerUrl(host: string) {
    this.config = parseServerConfig(host);
    this.reconnect();
  }

  getConfig(): ParsedServerConfig {
    return this.config;
  }

  getLatency(): number {
    return this.currentLatency;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify('socket_status', {
          connected: true,
          config: this.config,
        });

        // Start 25s heartbeat to keep connection alive through cloud proxies / ALBs
        this.startPingHeartbeat();

        // Send an initial ping immediately to measure connection latency
        this.ping();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event) {
            if (parsed.event === 'pong') {
              const now = Date.now();
              const sentAt = parsed.data?.timestamp || this.lastPingSent;
              this.currentLatency = Math.max(1, now - sentAt);
              this.notify('latency', { ms: this.currentLatency });
            } else if (parsed.event === 'keepalive') {
              // Acknowledge server keepalive
              this.send('ping', { timestamp: Date.now() });
            } else {
              this.notify(parsed.event, parsed.data);
            }
          }
        } catch {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopPingHeartbeat();
        this.notify('socket_status', { connected: false });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        this.isConnected = false;
        this.stopPingHeartbeat();
        this.notify('socket_status', { connected: false, error: err });
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private ping() {
    if (this.isConnected) {
      this.lastPingSent = Date.now();
      this.send('ping', { timestamp: this.lastPingSent });
    }
  }

  private startPingHeartbeat() {
    this.stopPingHeartbeat();
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 25000);
  }

  private stopPingHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.stopPingHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  send(event: string, data: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ event, data }));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  subscribe(listener: SocketListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: string, data: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(event, data);
      } catch {
        // ignore
      }
    });
  }

  getIsSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const tvSocket = new TvWebSocketClient();
