// ============================================
// NIVA — Communication Hub Routes
// ============================================

import { Router, Request, Response } from 'express';
import { communicationService } from './communication.service';
import { logger } from '../../utils/logger';

export const communicationRoutes = Router();

// --- Contacts Endpoints ---

communicationRoutes.get('/contacts', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string | undefined;
    const contacts = communicationService.getContacts(query);
    return res.json({ success: true, contacts });
  } catch (err: any) {
    logger.error('Failed to get contacts:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.get('/contacts/:id', (req: Request, res: Response) => {
  try {
    const contact = communicationService.getContact(req.params.id as string);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }
    return res.json({ success: true, contact });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.post('/contacts', (req: Request, res: Response) => {
  try {
    const saved = communicationService.saveContact(req.body);
    return res.json({ success: true, contact: saved });
  } catch (err: any) {
    logger.error('Failed to save contact:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.delete('/contacts/:id', (req: Request, res: Response) => {
  try {
    const deleted = communicationService.deleteContact(req.params.id as string);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- Outbound Message Dispatch ---

communicationRoutes.post('/send', async (req: Request, res: Response) => {
  try {
    const { channel, recipient, subject, content } = req.body;
    if (!channel || !recipient || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: channel, recipient, and content are required'
      });
    }

    const result = await communicationService.sendMessage({
      channel,
      recipient,
      subject,
      content
    });

    return res.json({ success: true, result });
  } catch (err: any) {
    logger.error('Failed to dispatch communication:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.get('/history', (_req: Request, res: Response) => {
  try {
    const history = communicationService.getOutboundHistory();
    return res.json({ success: true, history });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// --- AI Call Endpoints ---

communicationRoutes.post('/call/start', (req: Request, res: Response) => {
  try {
    const { contactName, phoneNumber, direction } = req.body;
    if (!contactName || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'contactName and phoneNumber required' });
    }

    const session = communicationService.startCall(contactName, phoneNumber, direction || 'outgoing');
    return res.json({ success: true, session });
  } catch (err: any) {
    logger.error('Failed to start call:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.post('/call/:id/transcript', (req: Request, res: Response) => {
  try {
    const { speaker, text } = req.body;
    const session = communicationService.addCallTranscript(req.params.id as string, speaker, text);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Call session not found' });
    }
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.post('/call/:id/toggle-record', (req: Request, res: Response) => {
  try {
    const session = communicationService.toggleCallRecording(req.params.id as string);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Call session not found' });
    }
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.post('/call/:id/end', (req: Request, res: Response) => {
  try {
    const { duration } = req.body;
    const session = communicationService.endCall(req.params.id as string, duration);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Call session not found' });
    }
    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.get('/call/history', (_req: Request, res: Response) => {
  try {
    const calls = communicationService.getCallHistory();
    return res.json({ success: true, calls });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.get('/call/policy', (_req: Request, res: Response) => {
  try {
    const policy = communicationService.getCallPolicy();
    return res.json({ success: true, policy });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

communicationRoutes.post('/call/policy', (req: Request, res: Response) => {
  try {
    const policy = communicationService.updateCallPolicy(req.body);
    return res.json({ success: true, policy });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
