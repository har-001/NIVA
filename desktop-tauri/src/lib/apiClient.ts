// ============================================
// NIVA — Shared Desktop API Client
// Connects to NIVA Backend (http://localhost:3001)
// ============================================

import { io, Socket } from 'socket.io-client';
import { DeviceIdentity } from '../types/desktop';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class DesktopApiClient {
  private token: string | null = null;
  private socket: Socket | null = null;

  constructor() {
    this.token = localStorage.getItem('niva_desktop_token');
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('niva_desktop_token', token);
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearToken() {
    this.token = null;
    localStorage.removeItem('niva_desktop_token');
  }

  /**
   * Check Backend Server Status
   */
  async checkHealth(): Promise<{ online: boolean; status?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/devops/status`);
      if (res.ok) {
        const data = await res.json();
        return { online: true, status: data.status || 'healthy' };
      }
      return { online: false };
    } catch {
      return { online: false };
    }
  }

  /**
   * Register or pair Desktop Device with NIVA Backend
   */
  async registerDevice(identity: DeviceIdentity): Promise<{ success: boolean; deviceId: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@niva.ai',
          password: 'password123',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          this.setToken(data.token);
        }
      }

      return { success: true, deviceId: identity.device_id };
    } catch {
      return { success: false, deviceId: identity.device_id };
    }
  }

  /**
   * Send assistant prompt to backend AI stream
   */
  async sendMessage(
    message: string,
    onChunk?: (text: string) => void
  ): Promise<{ text: string; success: boolean }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const res = await fetch(`${API_BASE_URL}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        return { text: `Server error: ${res.statusText}`, success: false };
      }

      const data = await res.json();
      const reply = data.reply || data.content || data.message || 'Understood.';
      onChunk?.(reply);
      return { text: reply, success: true };
    } catch (err) {
      const errorMsg = 'Backend connection offline. Ensure start-laptop.bat is active.';
      onChunk?.(errorMsg);
      return { text: errorMsg, success: false };
    }
  }

  /**
   * Initialize real-time Socket.io connection for events
   */
  getSocket(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: { token: this.token },
        reconnection: true,
      });

      this.socket.on('connect', () => {
        console.log('[TauriDesktop] Socket connected to NIVA server.');
      });
    }
    return this.socket;
  }
}

export const apiClient = new DesktopApiClient();
