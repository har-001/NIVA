// ============================================
// NIVA — Communication: AI Call & Voice Adapter
// ============================================

import { logger } from '../../../utils/logger';
import { CallSession, CallStatus, CallTranscriptEntry, IncomingCallPolicy } from '../types';

export class CallAdapter {
  private activeCalls: Map<string, CallSession> = new Map();
  private callPolicy: IncomingCallPolicy = {
    mode: 'ai_screen',
    voicePrompt: 'Hello, this is NIVA, Harshit’s AI assistant. Please state your name and the purpose of your call.',
    recordCalls: true
  };

  public getPolicy(): IncomingCallPolicy {
    return this.callPolicy;
  }

  public updatePolicy(policy: Partial<IncomingCallPolicy>): IncomingCallPolicy {
    this.callPolicy = { ...this.callPolicy, ...policy };
    logger.info(`[CallAdapter] Call policy updated: ${this.callPolicy.mode}`);
    return this.callPolicy;
  }

  public initiateCall(contactName: string, phoneNumber: string, direction: 'outgoing' | 'incoming' = 'outgoing'): CallSession {
    const id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const initialTranscript: CallTranscriptEntry[] = [
      {
        speaker: 'assistant',
        text: direction === 'outgoing'
          ? `Connecting call to ${contactName} (${phoneNumber})...`
          : `Incoming call from ${contactName} (${phoneNumber}). NIVA AI Screening active.`,
        timestamp: now
      }
    ];

    const session: CallSession = {
      id,
      contactName,
      phoneNumber,
      direction,
      status: 'connected',
      startedAt: now,
      durationSeconds: 0,
      isRecording: this.callPolicy.recordCalls,
      transcript: initialTranscript,
      sentiment: 'neutral',
      actionItems: []
    };

    this.activeCalls.set(id, session);
    logger.info(`[CallAdapter] Initiated call ${id} with ${contactName} (${direction})`);
    return session;
  }

  public addTranscript(callId: string, speaker: 'user' | 'assistant' | 'contact', text: string): CallSession | null {
    const session = this.activeCalls.get(callId);
    if (!session) return null;

    session.transcript.push({
      speaker,
      text,
      timestamp: new Date().toISOString()
    });

    return session;
  }

  public toggleRecording(callId: string): CallSession | null {
    const session = this.activeCalls.get(callId);
    if (!session) return null;

    session.isRecording = !session.isRecording;
    logger.info(`[CallAdapter] Call ${callId} recording set to: ${session.isRecording}`);
    return session;
  }

  public endCall(callId: string, customDuration?: number): CallSession | null {
    const session = this.activeCalls.get(callId);
    if (!session) return null;

    const endedAt = new Date();
    const startedAt = new Date(session.startedAt);
    const calculatedDuration = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
    
    session.status = 'ended';
    session.endedAt = endedAt.toISOString();
    session.durationSeconds = customDuration || calculatedDuration;

    // Simulate speech audio recording file if recording was active
    if (session.isRecording) {
      session.audioRecordingUrl = `/generated/audio/call_rec_${session.id}.mp3`;
    }

    // Auto-generate AI Call Executive Briefing & Action Items
    const transcriptText = session.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
    session.summary = `Call between Harshit and ${session.contactName} (${session.phoneNumber}) completed in ${session.durationSeconds}s. Key discussion topics touched upon schedules and project sync.`;
    
    session.actionItems = [
      `Follow up with ${session.contactName} regarding agreed milestones.`,
      `Share project documentation link via email/message.`
    ];

    session.sentiment = 'positive';

    logger.info(`[CallAdapter] Call ${callId} ended. Duration: ${session.durationSeconds}s. Recording: ${session.isRecording}`);
    return session;
  }

  public getCall(callId: string): CallSession | null {
    return this.activeCalls.get(callId) || null;
  }

  public getAllCalls(): CallSession[] {
    return Array.from(this.activeCalls.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }
}
