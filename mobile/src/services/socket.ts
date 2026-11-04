import { DiscoveredTv, SavedTv, TvSettings, TvState } from '../types/tv';

export type SocketListener = (event: string, data: any) => void;

class TvWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = 'ws://localhost:3000/ws';
  private listeners: Set<SocketListener> = new Set();
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;
  private isConnected = false;

  constructor() {
    // If running in development with custom IP
    const envUrl = process.env.EXPO_PUBLIC_WS_URL;
    if (envUrl) {
      this.url = envUrl;
    }
  }

  setServerUrl(host: string, port = 3000) {
    this.url = `ws://${host}:${port}/ws`;
    this.reconnect();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notify('socket_status', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event) {
            this.notify(parsed.event, parsed.data);
          }
        } catch (e) {
          // ignore non-json
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify('socket_status', { connected: false });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        this.isConnected = false;
        this.notify('socket_status', { connected: false, error: err });
      };
    } catch (e) {
      this.scheduleReconnect();
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
      } catch (e) {
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
      } catch (e) {
        // ignore
      }
    });
  }

  getIsSocketConnected(): boolean {
    return this.isConnected;
  }
}

export const tvSocket = new TvWebSocketClient();

