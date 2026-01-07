import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';

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

  /**
   * Get group chat messages (MANAGER and ADMIN only)
   *
   * Per Sujet 2: "Discussion de groupe entre les employés"
   *
   * Returns messages from the global employee group conversation.
   * Uses conversationId 'global-employee-chat' for the main employee chat room.
   */
  @Get('group')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getGroupMessages(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('conversationId') conversationId?: string,
  ) {
    // Default to global employee chat
    const targetConversationId = conversationId || 'global-employee-chat';

    const messages = await this.prisma.groupMessage.findMany({
      where: { conversationId: targetConversationId },
      orderBy: { createdAt: 'asc' },
      take: limit ? parseInt(limit) : 50,
    });

    // Fetch sender details separately to avoid include issues
    const senderIds = [...new Set(messages.map(m => m.senderId))];
    const senders = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      include: { profile: true },
    });

    const senderMap = new Map(senders.map(s => [s.id, s]));

    return messages.map((msg) => {
      const sender = senderMap.get(msg.senderId);
      return {
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        senderName: sender ? `${sender.profile?.firstName} ${sender.profile?.lastName}` : 'Unknown',
        senderRole: sender?.role || 'UNKNOWN',
        createdAt: msg.createdAt,
      };
    });
  }
}
