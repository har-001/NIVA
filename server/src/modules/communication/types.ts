// ============================================
// NIVA — Communication Hub Types
// ============================================

export type CommunicationChannel = 'email' | 'whatsapp' | 'telegram' | 'sms' | 'call';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  company?: string;
  role?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundMessageRequest {
  channel: CommunicationChannel;
  recipient: string; // Email address, phone number, or handle
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface OutboundMessageResult {
  id: string;
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  content: string;
  status: 'sent' | 'simulated' | 'queued' | 'failed';
  actionUrl?: string; // e.g. https://wa.me/..., mailto:..., t.me/...
  sentAt: string;
  details?: string;
}

export type CallStatus = 'dialing' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface CallTranscriptEntry {
  speaker: 'user' | 'assistant' | 'contact';
  text: string;
  timestamp: string;
}

export interface CallSession {
  id: string;
  contactName: string;
  phoneNumber: string;
  direction: 'outgoing' | 'incoming';
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  isRecording: boolean;
  audioRecordingUrl?: string;
  transcript: CallTranscriptEntry[];
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'urgent';
  actionItems?: string[];
}

export interface IncomingCallPolicy {
  mode: 'always_answer' | 'ai_screen' | 'reject_unknown' | 'manual';
  voicePrompt: string;
  recordCalls: boolean;
}
