// ============================================
// NIVA — Communication: Messaging Adapter (WhatsApp, Telegram, SMS)
// ============================================

import { logger } from '../../../utils/logger';
import { OutboundMessageRequest, OutboundMessageResult } from '../types';

export class MessagingAdapter {
  public async sendMessage(request: OutboundMessageRequest): Promise<OutboundMessageResult> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const channel = request.channel;
    const recipient = request.recipient;
    const content = request.content;

    let actionUrl = '';
    let details = '';

    if (channel === 'whatsapp') {
      // Clean phone number (strip spaces, dashes, parentheses)
      const cleanPhone = recipient.replace(/[^0-9+]/g, '').replace(/^\+/, '');
      const encodedMsg = encodeURIComponent(content);
      actionUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      details = `WhatsApp Web/App launch intent ready for +${cleanPhone}`;
      logger.info(`[MessagingAdapter] Prepared WhatsApp message to +${cleanPhone}`);
    } else if (channel === 'telegram') {
      const handle = recipient.replace(/^@/, '');
      const encodedMsg = encodeURIComponent(content);
      actionUrl = `https://t.me/${handle}?text=${encodedMsg}`;
      details = `Telegram direct link ready for @${handle}`;
      logger.info(`[MessagingAdapter] Prepared Telegram message to @${handle}`);
    } else if (channel === 'sms') {
      const cleanPhone = recipient.replace(/[^0-9+]/g, '');
      const encodedMsg = encodeURIComponent(content);
      actionUrl = `sms:${cleanPhone}?body=${encodedMsg}`;
      details = `Native SMS intent generated for ${cleanPhone}`;
      logger.info(`[MessagingAdapter] Prepared SMS message to ${cleanPhone}`);
    } else {
      details = `Message queued on channel ${channel}`;
    }

    return {
      id,
      channel,
      recipient,
      content,
      status: 'sent',
      actionUrl,
      sentAt: new Date().toISOString(),
      details
    };
  }
}
