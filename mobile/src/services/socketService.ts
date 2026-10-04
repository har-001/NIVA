// ============================================
// NIVA — Mobile Socket.IO Real-Time Streaming Service
// Handles live token streaming, telemetry, and remote status
// ============================================

import { io, Socket } from 'socket.io-client';
import { mobileApiClient } from './apiClient';

export type StreamChunkHandler = (data: { conversationId: string; chunk: string }) => void;
export type StreamEndHandler = (data: { conversationId: string; fullContent?: string }) => void;
export type MessageHandler = (msg: any) => void;
export type TelemetryHandler = (telemetry: any) => void;

class NivaSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private streamChunkListeners: StreamChunkHandler[] = [];
  private streamEndListeners: StreamEndHandler[] = [];
  private messageListeners: MessageHandler[] = [];
  private telemetryListeners: TelemetryHandler[] = [];

  /**
   * Connect to NIVA Backend Socket.IO Server
   */
  public connect(authToken?: string): void {
    if (this.socket && this.connected) return;

    const socketUrl = mobileApiClient.getSocketUrl();
    const token = authToken || mobileApiClient.getToken() || '';

    try {
      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1500,
        timeout: 8000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });

      this.socket.on('connect_error', () => {
        this.connected = false;
      });

      // Stream events from server
      this.socket.on('chat:stream', (data: { conversationId: string; chunk: string }) => {
        this.streamChunkListeners.forEach((fn) => fn(data));
      });

      this.socket.on('chat:stream_end', (data: { conversationId: string; fullContent?: string }) => {
        this.streamEndListeners.forEach((fn) => fn(data));
      });

      this.socket.on('chat:message', (data: any) => {
        this.messageListeners.forEach((fn) => fn(data));
      });

      this.socket.on('telemetry:update', (data: any) => {
        this.telemetryListeners.forEach((fn) => fn(data));
      });
    } catch {
      this.connected = false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  public isConnected(): boolean {
    return this.connected && !!this.socket?.connected;
  }

  /**
   * Dispatch chat message via live WebSocket stream
   */
  public sendStreamMessage(conversationId: string, content: string): boolean {
    if (!this.socket || !this.connected) {
      return false;
    }
    this.socket.emit('chat:send', { conversationId, content });
    return true;
  }

  public onStreamChunk(fn: StreamChunkHandler): () => void {
    this.streamChunkListeners.push(fn);
    return () => {
      this.streamChunkListeners = this.streamChunkListeners.filter((l) => l !== fn);
    };
  }

  public onStreamEnd(fn: StreamEndHandler): () => void {
    this.streamEndListeners.push(fn);
    return () => {
      this.streamEndListeners = this.streamEndListeners.filter((l) => l !== fn);
    };
  }

  public onMessage(fn: MessageHandler): () => void {
    this.messageListeners.push(fn);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== fn);
    };
  }

  public onTelemetry(fn: TelemetryHandler): () => void {
    this.telemetryListeners.push(fn);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter((l) => l !== fn);
    };
  }
}

export const mobileSocketService = new NivaSocketService();
export const socketService = mobileSocketService;
