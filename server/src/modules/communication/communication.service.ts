// ============================================
// NIVA — Communication Hub Service
// ============================================

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { EmailAdapter } from './adapters/email.adapter';
import { MessagingAdapter } from './adapters/messaging.adapter';
import { CallAdapter } from './adapters/call.adapter';
import {
  Contact,
  OutboundMessageRequest,
  OutboundMessageResult,
  CallSession,
  IncomingCallPolicy
} from './types';

export class CommunicationService {
  private emailAdapter: EmailAdapter;
  private messagingAdapter: MessagingAdapter;
  private callAdapter: CallAdapter;
  private contacts: Map<string, Contact> = new Map();
  private outboundHistory: OutboundMessageResult[] = [];

  constructor() {
    this.emailAdapter = new EmailAdapter();
    this.messagingAdapter = new MessagingAdapter();
    this.callAdapter = new CallAdapter();

    // Initialize seed contacts
    this.seedDefaultContacts();
  }

  private seedDefaultContacts(): void {
    const defaultContacts: Contact[] = [
      {
        id: 'cnt_1',
        name: 'Harshit Sharma',
        email: 'harshit@niva.ai',
        phone: '+91 98765 43210',
        company: 'NIVA Autonomous Systems',
        role: 'Founder & Lead Architect',
        notes: 'Owner of the system. Direct VIP priority.',
        isFavorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cnt_2',
        name: 'Sarah Connor',
        email: 'sarah.c@cyberdyne.org',
        phone: '+1 415 555 0192',
        company: 'Resistance Technologies',
        role: 'Operations Director',
        notes: 'Handles infrastructure security.',
        isFavorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cnt_3',
        name: 'Alex Rivera',
        email: 'alex.rivera@devcore.io',
        phone: '+1 212 555 7839',
        company: 'DevCore Studio',
        role: 'Full-Stack Engineer',
        notes: 'Frontend and graphics collaborator.',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cnt_4',
        name: 'Dr. Elena Vance',
        email: 'e.vance@blackmesa.edu',
        phone: '+44 20 7946 0122',
        company: 'Applied Physics Lab',
        role: 'Chief AI Scientist',
        notes: 'Advises on neural embeddings & vision.',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const c of defaultContacts) {
      this.contacts.set(c.id, c);
    }
  }

  // --- Contacts Management ---

  public getContacts(query?: string): Contact[] {
    let list = Array.from(this.contacts.values());
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  }

  public getContact(id: string): Contact | null {
    return this.contacts.get(id) || null;
  }

  public saveContact(contactData: Partial<Contact>): Contact {
    const id = contactData.id || `cnt_${Date.now()}`;
    const existing = this.contacts.get(id);

    const updated: Contact = {
      id,
      name: contactData.name || existing?.name || 'Unknown Contact',
      email: contactData.email || existing?.email || '',
      phone: contactData.phone || existing?.phone || '',
      avatar: contactData.avatar || existing?.avatar,
      company: contactData.company || existing?.company || '',
      role: contactData.role || existing?.role || '',
      notes: contactData.notes || existing?.notes || '',
      isFavorite: contactData.isFavorite !== undefined ? contactData.isFavorite : existing?.isFavorite || false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.contacts.set(id, updated);
    logger.info(`[CommunicationService] Saved contact ${updated.name} (${id})`);
    return updated;
  }

  public deleteContact(id: string): boolean {
    const deleted = this.contacts.delete(id);
    if (deleted) {
      logger.info(`[CommunicationService] Deleted contact ${id}`);
    }
    return deleted;
  }

  // --- Outbound Message Dispatch ---

  public async sendMessage(request: OutboundMessageRequest): Promise<OutboundMessageResult> {
    let result: OutboundMessageResult;

    if (request.channel === 'email') {
      result = await this.emailAdapter.sendEmail(request);
    } else {
      result = await this.messagingAdapter.sendMessage(request);
    }

    this.outboundHistory.unshift(result);
    // Keep max 100 history items
    if (this.outboundHistory.length > 100) {
      this.outboundHistory.pop();
    }

    // Try recording in Prisma Audit / DB if possible
    try {
      await prisma.auditEvent.create({
        data: {
          action: `communication_${request.channel}`,
          resource: request.recipient,
          details: {
            subject: request.subject,
            contentPreview: request.content.substring(0, 100),
            status: result.status,
            actionUrl: result.actionUrl
          },
          success: true
        }
      });
    } catch {
      // Prisma logging fallback
    }

    return result;
  }

  public getOutboundHistory(): OutboundMessageResult[] {
    return this.outboundHistory;
  }

  // --- Call Management ---

  public startCall(contactName: string, phoneNumber: string, direction: 'outgoing' | 'incoming' = 'outgoing'): CallSession {
    return this.callAdapter.initiateCall(contactName, phoneNumber, direction);
  }

  public addCallTranscript(callId: string, speaker: 'user' | 'assistant' | 'contact', text: string): CallSession | null {
    return this.callAdapter.addTranscript(callId, speaker, text);
  }

  public toggleCallRecording(callId: string): CallSession | null {
    return this.callAdapter.toggleRecording(callId);
  }

  public endCall(callId: string, duration?: number): CallSession | null {
    return this.callAdapter.endCall(callId, duration);
  }

  public getCallSession(callId: string): CallSession | null {
    return this.callAdapter.getCall(callId);
  }

  public getCallHistory(): CallSession[] {
    return this.callAdapter.getAllCalls();
  }

  public getCallPolicy(): IncomingCallPolicy {
    return this.callAdapter.getPolicy();
  }

  public updateCallPolicy(policy: Partial<IncomingCallPolicy>): IncomingCallPolicy {
    return this.callAdapter.updatePolicy(policy);
  }
}

export const communicationService = new CommunicationService();
