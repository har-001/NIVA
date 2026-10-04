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
  | 'custom_speech'
  | 'volume_up'
  | 'volume_down'
  | 'volume_mute'
  | 'media_play_pause'
  | 'take_screenshot';

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
  data?: any;
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

export interface MemoryItem {
  id: string;
  userId?: string;
  content: string;
  category: string;
  pinned?: boolean;
  createdAt: string;
}

export interface VisionAnalysisRequest {
  image: string;
  prompt?: string;
}

export interface VisionAnalysisResponse {
  success: boolean;
  description: string;
  tags?: string[];
  error?: string;
}

export interface DeviceRegistration {
  id: string;
  name: string;
  type: 'mobile';
  isTrusted: boolean;
  fingerprint?: string;
  lastSeenAt: string;
}

export interface VoiceSettings {
  gender: 'male' | 'female';
  rate: number;
  pitch: number;
  autoSpeak: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  telegram?: string;
  relationship?: string;
}

export interface OutboundMessageRequest {
  channel: 'email' | 'whatsapp' | 'telegram';
  recipient: string;
  subject?: string;
  content: string;
}

export interface CallTranscript {
  id: string;
  speaker: 'ai' | 'contact' | 'user';
  text: string;
  timestamp: string;
}

export interface CallSession {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: 'incoming' | 'outgoing';
  status: 'ringing' | 'connected' | 'completed';
  isRecording: boolean;
  startedAt: string;
  endedAt?: string;
  transcripts: CallTranscript[];
}

