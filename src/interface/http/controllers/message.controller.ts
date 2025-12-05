import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard.js';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get conversations for a user
   */
  @Get('conversations')
  async getConversations(@Query('userId') userId: string) {
    const conversations = await this.prisma.privateConversation.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId },
        ],
      },
      include: {
        user1: {
          include: { profile: true },
        },
        user2: {
          include: { profile: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      otherUser: conv.user1Id === userId ? {
        id: conv.user2.id,
        name: `${conv.user2.profile?.firstName} ${conv.user2.profile?.lastName}`,
        role: conv.user2.role,
      } : {
        id: conv.user1.id,
        name: `${conv.user1.profile?.firstName} ${conv.user1.profile?.lastName}`,
        role: conv.user1.role,
      },
      lastMessage: conv.messages[0] || null,
      createdAt: conv.createdAt,
    }));
  }

  /**
   * Get messages in a conversation
   */
  @Get('conversations/:conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: `${msg.sender.profile?.firstName} ${msg.sender.profile?.lastName}`,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Get unread message count
   */
  @Get('unread')
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { count };
  }
}
