// ============================================
// NIVA — Desktop Types (Tauri + React)
// ============================================

export interface DeviceIdentity {
  device_id: string;
  hostname: string;
  os_name: string;
  platform: string;
  cpu_brand: string;
  total_memory_gb: number;
}

export interface SystemTelemetry {
  cpu_usage: number;
  used_memory_gb: number;
  total_memory_gb: number;
  uptime_hours: number;
  process_count: number;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string | null;
}

export type AllowedApp =
  | 'notepad'
  | 'calculator'
  | 'calc'
  | 'chrome'
  | 'browser'
  | 'vscode'
  | 'code'
  | 'explorer'
  | 'settings'
  | 'terminal'
  | 'cmd';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AuthSession {
  token: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  paired: boolean;
}

export type SystemPowerAction = 'lock' | 'restart' | 'shutdown';

export interface NotificationPayload {
  title: string;
  body: string;
}

export interface SafeFileResult {
  success: boolean;
  content?: string;
  error?: string | null;
}

// Vision & Gesture Types
export type GestureType =
  | 'fist'
  | 'open_palm'
  | 'point_up'
  | 'point_down'
  | 'peace'
  | 'thumbs_up'
  | 'rock'
  | 'none';

export interface GestureEvent {
  gesture: GestureType;
  confidence: number;
  timestamp: number;
}

export interface GestureActionMapping {
  gesture: GestureType;
  action: string;
  label: string;
  emoji: string;
}

export type CameraState = 'inactive' | 'requesting' | 'active' | 'error';
