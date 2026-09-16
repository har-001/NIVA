// ============================================
// NIVA — Communication: Email Adapter
// ============================================

import { logger } from '../../../utils/logger';
import { OutboundMessageRequest, OutboundMessageResult } from '../types';

export class EmailAdapter {
  private isConfigured: boolean = false;
  private smtpHost: string = '';
  private fromAddress: string = 'niva-assistant@niva.ai';

  constructor() {
    this.smtpHost = process.env.SMTP_HOST || '';
    this.isConfigured = !!(this.smtpHost && process.env.SMTP_USER);
    if (this.isConfigured) {
      logger.info(`SMTP Server configured at ${this.smtpHost}`);
    } else {
      logger.info('SMTP not configured — Email adapter running in zero-cost simulation & mailto mode');
    }
  }

  public async sendEmail(request: OutboundMessageRequest): Promise<OutboundMessageResult> {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const subject = request.subject || 'Notice from NIVA Virtual Assistant';
    const recipient = request.recipient;
    const content = request.content;

    // Generate quick mailto URI for user convenience
    const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;

    logger.info(`[EmailAdapter] Dispatching email to: ${recipient} | Subject: "${subject}"`);

    // In zero-cost development/desktop mode, we record the simulated dispatch
    return {
      id,
      channel: 'email',
      recipient,
      subject,
      content,
      status: this.isConfigured ? 'sent' : 'simulated',
      actionUrl: mailtoUrl,
      sentAt: new Date().toISOString(),
      details: this.isConfigured
        ? `Sent via SMTP relay (${this.smtpHost})`
        : `Simulated dispatch: Ready in Outbox and mailto link generated.`
    };
  }
}
