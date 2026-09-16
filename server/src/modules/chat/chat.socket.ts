// ============================================
// NIVA — Socket.IO Handler
// ============================================

import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AuthPayload } from '../../middleware/auth';
import { chatService } from './chat.service';
import { nivaAgent } from '../ai/agent';
import { logger } from '../../utils/logger';

interface AuthenticatedSocket extends Socket {
  user?: AuthPayload;
}

export function setupChatSocket(io: SocketServer): void {
  // Authentication middleware for sockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;
    logger.info(`Socket connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle send message
    socket.on('chat:send', async (data: {
      conversationId: string;
      content: string;
    }) => {
      try {
        // Save user message
        const userMessage = await chatService.addMessage(
          data.conversationId,
          'user',
          data.content
        );

        // Emit message saved confirmation
        socket.emit('chat:message', {
          ...userMessage,
          status: 'saved',
        });

        // Emit thinking state
        socket.emit('chat:status', {
          conversationId: data.conversationId,
          status: 'thinking',
        });

        // Fetch conversation history for context
        let history: any[] = [];
        try {
          const conv = await chatService.getConversation(userId, data.conversationId);
          // Take last 10 messages before the current one
          history = (conv.messages || [])
            .slice(-10)
            .filter((m: any) => m.id !== userMessage.id)
            .map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            }));
        } catch {
          // fallback with empty history
        }

        let accumulatedContent = '';

        // Run NIVA agent stream (now memory-aware with userId)
        for await (const event of nivaAgent.chatStream(history, data.content, {
          platform: 'desktop',
          osInfo: 'Windows Laptop',
          userId,
        })) {
          if (event.type === 'chunk' && event.content) {
            accumulatedContent += event.content;
            socket.emit('chat:chunk', {
              conversationId: data.conversationId,
              content: event.content,
              accumulated: accumulatedContent,
            });
          } else if (event.type === 'tool_call' && event.toolCall) {
            socket.emit('chat:tool_call', {
              conversationId: data.conversationId,
              tool: event.toolCall,
            });
          } else if (event.type === 'tool_result' && event.toolResult) {
            socket.emit('chat:tool_result', {
              conversationId: data.conversationId,
              toolResult: event.toolResult,
            });
          } else if (event.type === 'error') {
            socket.emit('chat:error', { message: event.error });
          }
        }

        // Save completed assistant message in database
        const assistantMessage = await chatService.addMessage(
          data.conversationId,
          'assistant',
          accumulatedContent || 'Done.'
        );

        socket.emit('chat:message', {
          ...assistantMessage,
          status: 'complete',
        });

        socket.emit('chat:status', {
          conversationId: data.conversationId,
          status: 'idle',
        });

        // Auto-update conversation title if it's default
        try {
          const conv = await chatService.getConversation(userId, data.conversationId);
          if (conv.title === 'New Conversation') {
            const shortTitle = data.content.slice(0, 30).trim() + (data.content.length > 30 ? '...' : '');
            await chatService.updateTitle(userId, data.conversationId, shortTitle);
            socket.emit('chat:title_updated', {
              conversationId: data.conversationId,
              title: shortTitle,
            });
          }
        } catch {
          // ignore title auto-update errors
        }
      } catch (error) {
        logger.error('Chat send error:', error);
        socket.emit('chat:error', {
          message: 'Failed to process message',
        });
      }
    });

    // Handle typing indicator
    socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(`user:${userId}`).emit('chat:typing', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${userId}`);
    });
  });
}
