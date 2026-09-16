// ============================================
// NIVA — Chat Service
// ============================================

import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';

class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string) {
    return prisma.conversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, role: true, createdAt: true },
        },
      },
    });
  }

  /**
   * Get a single conversation with messages
   */
  async getConversation(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId, isActive: true },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return conversation;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    role: string,
    content: string,
    metadata?: Record<string, unknown>
  ) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Update conversation title
   */
  async updateTitle(userId: string, conversationId: string, title: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Soft-delete a conversation
   */
  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { isActive: false },
    });
  }
}

export const chatService = new ChatService();
