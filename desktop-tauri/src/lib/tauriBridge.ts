// ============================================
// NIVA — Tauri Universal Bridge
// Bridges native Rust commands with web fallback
// ============================================

import { DeviceIdentity, SystemTelemetry, CommandResult, AllowedApp } from '../types/desktop';

// Check if running inside actual Tauri webview window
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Invoke native or mocked Tauri command
 */
export async function invokeCommand<T>(command: string, args: Record<string, unknown> = {}): Promise<T> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(command, args);
    } catch (err) {
      console.warn(`[TauriBridge] Native invoke '${command}' failed, falling back to mock:`, err);
    }
  }

  // Fallback / Web simulation implementation
  return mockInvoke<T>(command, args);
}

/**
 * Mock dispatcher for browser development & automated testing
 */
function mockInvoke<T>(command: string, args: Record<string, unknown>): T {
  switch (command) {
    case 'get_device_identity':
      return {
        device_id: 'NIVA-PC-HARSHIT-1582',
        hostname: 'HARSHIT',
        os_name: 'Windows 11 Home (x64)',
        platform: 'windows',
        cpu_brand: 'AMD Ryzen 7 7435HS with Radeon Graphics',
        total_memory_gb: 15.82,
      } as unknown as T;

    case 'get_telemetry': {
      // Dynamic realistic simulation
      const baseCpu = 18 + Math.random() * 15;
      const baseRam = 14.5 + Math.random() * 0.8;
      return {
        cpu_usage: Math.round(baseCpu * 10) / 10,
        used_memory_gb: Math.round(baseRam * 100) / 100,
        total_memory_gb: 15.82,
        uptime_hours: 3.8,
        process_count: 248,
      } as unknown as T;
    }

    case 'launch_allowed_app': {
      const appName = String(args.appName || 'notepad').toLowerCase();
      console.log(`[TauriBridge:Mock] Simulating native app launch: ${appName}`);
      return {
        success: true,
        output: `Launched ${appName} via Desktop Subsystem`,
        error: null,
      } as unknown as T;
    }

    case 'toggle_hud':
    case 'toggle_main_window':
      return true as unknown as T;

    case 'lock_workstation':
      console.log('[TauriBridge:Mock] Simulating workstation lock');
      return {
        success: true,
        output: 'Workstation locked securely (Simulation).',
        error: null,
      } as unknown as T;

    case 'restart_pc': {
      const confirmed = Boolean(args.confirmed);
      if (!confirmed) {
        return {
          success: false,
          output: '',
          error: 'Restart aborted: Explicit confirmation required.',
        } as unknown as T;
      }
      console.log('[TauriBridge:Mock] Simulating system restart with confirmation');
      return {
        success: true,
        output: 'System restart scheduled in 5 seconds (Simulation).',
        error: null,
      } as unknown as T;
    }

    case 'shutdown_pc': {
      const confirmed = Boolean(args.confirmed);
      if (!confirmed) {
        return {
          success: false,
          output: '',
          error: 'Shutdown aborted: Explicit confirmation required.',
        } as unknown as T;
      }
      console.log('[TauriBridge:Mock] Simulating system shutdown with confirmation');
      return {
        success: true,
        output: 'System shutdown scheduled in 5 seconds (Simulation).',
        error: null,
      } as unknown as T;
    }

    case 'cancel_power_action':
      console.log('[TauriBridge:Mock] Simulating power action cancellation');
      return {
        success: true,
        output: 'Pending power action cancelled (Simulation).',
        error: null,
      } as unknown as T;

    case 'show_native_notification': {
      const title = String(args.title || 'NIVA Alert');
      const body = String(args.body || '');
      console.log(`[TauriBridge:Mock] Notification shown: [${title}] ${body}`);
      return {
        success: true,
        output: `Notification shown: ${title}`,
        error: null,
      } as unknown as T;
    }

    case 'read_desktop_file': {
      const filePath = String(args.filePath || '');
      console.log(`[TauriBridge:Mock] Reading desktop file: ${filePath}`);
      return {
        success: true,
        output: `[SIMULATED FILE CONTENT for ${filePath}]`,
        error: null,
      } as unknown as T;
    }

    default:
      throw new Error(`Unknown Tauri command: ${command}`);
  }
}

// Convenient typed helpers
export const getDeviceIdentity = () => invokeCommand<DeviceIdentity>('get_device_identity');
export const getSystemTelemetry = () => invokeCommand<SystemTelemetry>('get_telemetry');
export const launchAllowedApp = (appName: AllowedApp) =>
  invokeCommand<CommandResult>('launch_allowed_app', { appName });
export const toggleHUD = () => invokeCommand<boolean>('toggle_hud');
export const toggleMainWindow = () => invokeCommand<boolean>('toggle_main_window');

// Power Management Helpers
export const lockWorkstation = () => invokeCommand<CommandResult>('lock_workstation');
export const restartPC = (confirmed: boolean) =>
  invokeCommand<CommandResult>('restart_pc', { confirmed });
export const shutdownPC = (confirmed: boolean) =>
  invokeCommand<CommandResult>('shutdown_pc', { confirmed });
export const cancelPowerAction = () => invokeCommand<CommandResult>('cancel_power_action');

// Native Notification Helper
export const showNativeNotification = (title: string, body: string) =>
  invokeCommand<CommandResult>('show_native_notification', { title, body });

// Safe Desktop File Reader Helper
export const readDesktopFile = (filePath: string) =>
  invokeCommand<CommandResult>('read_desktop_file', { filePath });
