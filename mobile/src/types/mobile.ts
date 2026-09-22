// ============================================
// NIVA — Mobile Client Data Types & Schemas
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt?: string;
}

export interface DesktopTelemetry {
  cpu_usage_percent: number;
  memory_used_gb: number;
  total_memory_gb: number;
  uptime_seconds: number;
  process_count: number;
  hostname: string;
  os_name: string;
  lastUpdated?: string;
}

export type AllowedApp =
  | 'notepad'
  | 'calculator'
  | 'chrome'
  | 'vscode'
  | 'explorer'
  | 'terminal';

export type RemoteCommandAction =
  | 'lock_workstation'
  | 'launch_app'
  | 'restart_pc'
  | 'shutdown_pc'
  | 'custom_speech';

export interface RemoteCommandRequest {
  action: RemoteCommandAction;
  app?: AllowedApp;
  confirmed?: boolean;
  text?: string;
  timestamp: number;
}

export interface RemoteCommandResponse {
  success: boolean;
  message: string;
  error?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  customUrl?: string;
}
