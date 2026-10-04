// ============================================
// NIVA — Cross-Platform Device Synchronization Service
// Unifies Web, Desktop Tauri, and Mobile Expo Identity & State
// ============================================

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'web' | 'desktop' | 'mobile';
  isTrusted: boolean;
  fingerprint?: string;
  ipAddress?: string;
  lastSeenAt: string;
  telemetry?: {
    battery?: number;
    platform?: string;
    version?: string;
  };
}

class NivaDeviceService {
  private devices: Map<string, DeviceInfo> = new Map();

  constructor() {
    // Seed standard devices for local development
    this.registerDevice({
      id: 'dev-desktop-host',
      name: 'Harshit Laptop (Tauri Desktop Arc HUD)',
      type: 'desktop',
      isTrusted: true,
      fingerprint: 'windows-11-tauri-host-v2',
      lastSeenAt: new Date().toISOString(),
      telemetry: { platform: 'Windows 11 Home', version: '2.0.0' },
    });

    this.registerDevice({
      id: 'dev-web-client',
      name: 'NIVA Cybernetic Web Console',
      type: 'web',
      isTrusted: true,
      fingerprint: 'nextjs-15-chromium-client',
      lastSeenAt: new Date().toISOString(),
      telemetry: { platform: 'Web Browser', version: '15.0.0' },
    });
  }

  public registerDevice(device: DeviceInfo): DeviceInfo {
    const existing = this.devices.get(device.id);
    const updated: DeviceInfo = {
      ...existing,
      ...device,
      lastSeenAt: new Date().toISOString(),
    };
    this.devices.set(device.id, updated);
    return updated;
  }

  public getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  public getDevice(id: string): DeviceInfo | undefined {
    return this.devices.get(id);
  }

  public updateHeartbeat(id: string, telemetry?: any): DeviceInfo | null {
    const device = this.devices.get(id);
    if (!device) return null;

    device.lastSeenAt = new Date().toISOString();
    if (telemetry) {
      device.telemetry = { ...device.telemetry, ...telemetry };
    }
    this.devices.set(id, device);
    return device;
  }

  public removeDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  public getUnifiedStatus(): {
    networkSync: boolean;
    connectedCount: number;
    devices: DeviceInfo[];
    ecosystem: {
      web: boolean;
      desktop: boolean;
      mobile: boolean;
    };
  } {
    const all = this.getDevices();
    const hasWeb = all.some((d) => d.type === 'web');
    const hasDesktop = all.some((d) => d.type === 'desktop');
    const hasMobile = all.some((d) => d.type === 'mobile');

    return {
      networkSync: true,
      connectedCount: all.length,
      devices: all,
      ecosystem: {
        web: hasWeb,
        desktop: hasDesktop,
        mobile: hasMobile,
      },
    };
  }
}

export const deviceService = new NivaDeviceService();
