import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { PrivateMessageSentEvent } from '../../application/event-handlers/chat-projector.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chat Gateway using WebSockets
 * 
 * Handles real-time chat between clients and advisors.
 * 
 * Logic (Section 5.6):
 * - If client sends message with no assigned advisor, broadcast to all advisors
 * - First advisor to reply becomes the conversation owner
 * - Future messages in that conversation go only to the assigned advisor
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Socket>(); // userId -> socket
  private readonly socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId`);
      client.disconnect();
      return;
    }

    this.userSockets.set(userId, client);
    this.socketUsers.set(client.id, userId);
    
    this.logger.log(`User ${userId} connected (socket: ${client.id})`);

    // Join user-specific room
    client.join(`user:${userId}`);

    // If user is an advisor/manager, join advisor room
    this.prisma.user.findUnique({ where: { id: userId } }).then((user) => {
      if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
        client.join('advisors');
        this.logger.log(`User ${userId} joined advisors room`);
      }
    });
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);
    
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  /**
   * Handle private message
   * 
   * Payload: { receiverId: string, content: string }
   */
  @SubscribeMessage('private_message')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: string; content: string },
  ) {
    const senderId = this.socketUsers.get(client.id);
    
    if (!senderId) {
      return { error: 'User not authenticated' };
    }

    const { receiverId, content } = payload;

    // Validate users exist
    const sender = await this.prisma.user.findUnique({ 
      where: { id: senderId },
      include: { profile: true },
    });
    const receiver = await this.prisma.user.findUnique({ 
      where: { id: receiverId },
    });

    if (!sender || !receiver) {
      return { error: 'Invalid sender or receiver' };
    }

    // Find or create conversation
    let conversation = await this.prisma.privateConversation.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    const conversationId = conversation?.id || uuidv4();

    // Publish domain event (will be persisted by projector)
    const event = new PrivateMessageSentEvent(
      conversationId,
      senderId,
      receiverId,
      content,
    );
    this.eventBus.publish(event);

    // Send message to receiver in real-time
    this.server.to(`user:${receiverId}`).emit('new_message', {
      conversationId,
      senderId,
      senderName: `${sender.profile?.firstName} ${sender.profile?.lastName}`,
      content,
      createdAt: new Date().toISOString(),
    });

    // Acknowledge to sender
    return {
      success: true,
      conversationId,
      message: 'Message sent',
    };
  }

  /**
   * Handle client request for help (Section 5.6)
   * 
   * If no advisor assigned, broadcast to all advisors.
   * First to reply becomes the owner.
   */
  @SubscribeMessage('request_help')
  async handleHelpRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string },
  ) {
    const clientId = this.socketUsers.get(client.id);
    
    if (!clientId) {
      return { error: 'User not authenticated' };
    }

    const clientUser = await this.prisma.user.findUnique({ 
      where: { id: clientId },
      include: { profile: true },
    });

    if (!clientUser || clientUser.role !== 'CLIENT') {
      return { error: 'Only clients can request help' };
    }

    // Check if client already has an active conversation with an advisor
    const existingConversation = await this.prisma.privateConversation.findFirst({
      where: {
        OR: [
          { user1Id: clientId },
          { user2Id: clientId },
        ],
      },
      include: {
        user1: true,
        user2: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // If conversation exists and last message was recent (within 1 hour), use that advisor
    if (existingConversation && existingConversation.messages.length > 0) {
      const lastMessage = existingConversation.messages[0];
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastMessage.createdAt > hourAgo) {
        const advisorId = existingConversation.user1Id === clientId 
          ? existingConversation.user2Id 
          : existingConversation.user1Id;

        // Send directly to assigned advisor
        const event = new PrivateMessageSentEvent(
          existingConversation.id,
          clientId,
          advisorId,
          payload.content,
        );
        this.eventBus.publish(event);

        this.server.to(`user:${advisorId}`).emit('help_request', {
          conversationId: existingConversation.id,
          clientId,
          clientName: `${clientUser.profile?.firstName} ${clientUser.profile?.lastName}`,
          content: payload.content,
          createdAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: 'Request sent to your assigned advisor',
          advisorAssigned: true,
        };
      }
    }

    // No recent conversation - broadcast to all advisors
    const conversationId = uuidv4();
    
    this.server.to('advisors').emit('help_request_broadcast', {
      conversationId,
      clientId,
      clientName: `${clientUser.profile?.firstName} ${clientUser.profile?.lastName}`,
      content: payload.content,
      createdAt: new Date().toISOString(),
    });

    this.logger.log(`Help request from ${clientId} broadcast to all advisors`);

    return {
      success: true,
      message: 'Request broadcast to advisors. First to respond will assist you.',
      advisorAssigned: false,
    };
  }

  /**
   * Advisor accepts help request (becomes conversation owner)
   */
  @SubscribeMessage('accept_help')
  async handleAcceptHelp(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; clientId: string; message: string },
  ) {
    const advisorId = this.socketUsers.get(client.id);
    
    if (!advisorId) {
      return { error: 'User not authenticated' };
    }

    const advisor = await this.prisma.user.findUnique({ 
      where: { id: advisorId },
      include: { profile: true },
    });

    if (!advisor || (advisor.role !== 'ADMIN' && advisor.role !== 'MANAGER')) {
      return { error: 'Only advisors can accept help requests' };
    }

    // Create or update conversation
    const conversation = await this.prisma.privateConversation.upsert({
      where: { id: payload.conversationId },
      create: {
        id: payload.conversationId,
        user1Id: payload.clientId,
        user2Id: advisorId,
      },
      update: {},
    });

    // Send acceptance message
    const event = new PrivateMessageSentEvent(
      payload.conversationId,
      advisorId,
      payload.clientId,
      payload.message || 'Hello! How can I help you today?',
    );
    this.eventBus.publish(event);

    // Notify client
    this.server.to(`user:${payload.clientId}`).emit('advisor_assigned', {
      conversationId: payload.conversationId,
      advisorId,
      advisorName: `${advisor.profile?.firstName} ${advisor.profile?.lastName}`,
      message: payload.message,
    });

    // Notify other advisors that this request is taken
    this.server.to('advisors').emit('help_request_taken', {
      conversationId: payload.conversationId,
      advisorId,
    });

    return {
      success: true,
      message: 'You are now assigned to this conversation',
    };
  }

  /**
   * Mark messages as read
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = this.socketUsers.get(client.id);
    
    if (!userId) {
      return { error: 'User not authenticated' };
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId: payload.conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }

  /**
   * Transfer conversation to another advisor
   * 
   * Payload: { conversationId: string, newAdvisorId: string, reason?: string }
   * 
   * Requirements:
   * - Only current conversation owner (advisor) can transfer
   * - New advisor must have ADMIN or MANAGER role
   * - Notifies both advisors and client about the transfer
   */
  @SubscribeMessage('transfer_conversation')
  async handleTransferConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; newAdvisorId: string; reason?: string },
  ) {
    const currentAdvisorId = this.socketUsers.get(client.id);
    
    if (!currentAdvisorId) {
      return { error: 'User not authenticated' };
    }

    // Verify current user is an advisor
    const currentAdvisor = await this.prisma.user.findUnique({
      where: { id: currentAdvisorId },
      include: { profile: true },
    });

    if (!currentAdvisor || (currentAdvisor.role !== 'ADMIN' && currentAdvisor.role !== 'MANAGER')) {
      return { error: 'Only advisors can transfer conversations' };
    }

    // Get conversation
    const conversation = await this.prisma.privateConversation.findUnique({
      where: { id: payload.conversationId },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } },
      },
    });

    if (!conversation) {
      return { error: 'Conversation not found' };
    }

    // Verify current advisor owns the conversation (user2 is the advisor)
    if (conversation.user2Id !== currentAdvisorId) {
      return { error: 'You are not the owner of this conversation' };
    }

    // Verify new advisor exists and has correct role
    const newAdvisor = await this.prisma.user.findUnique({
      where: { id: payload.newAdvisorId },
      include: { profile: true },
    });

    if (!newAdvisor) {
      return { error: 'New advisor not found' };
    }

    if (newAdvisor.role !== 'ADMIN' && newAdvisor.role !== 'MANAGER') {
      return { error: 'New advisor must have ADMIN or MANAGER role' };
    }

    // Prevent self-transfer
    if (currentAdvisorId === payload.newAdvisorId) {
      return { error: 'Cannot transfer conversation to yourself' };
    }

    // Transfer conversation
    await this.prisma.privateConversation.update({
      where: { id: payload.conversationId },
      data: { user2Id: payload.newAdvisorId },
    });

    const clientId = conversation.user1Id;
    const reason = payload.reason || 'Your conversation has been transferred to another advisor';

    // Create transfer notification message
    const transferMessage = `Conversation transferred from ${currentAdvisor.profile?.firstName} ${currentAdvisor.profile?.lastName} to ${newAdvisor.profile?.firstName} ${newAdvisor.profile?.lastName}. Reason: ${reason}`;
    
    // Send system message to conversation
    const systemMessageEvent = new PrivateMessageSentEvent(
      payload.conversationId,
      'system',
      clientId,
      transferMessage,
    );
    this.eventBus.publish(systemMessageEvent);

    // Notify new advisor about assignment
    this.server.to(`user:${payload.newAdvisorId}`).emit('conversation_transferred_to_you', {
      conversationId: payload.conversationId,
      clientId,
      clientName: `${conversation.user1.profile?.firstName} ${conversation.user1.profile?.lastName}`,
      fromAdvisor: `${currentAdvisor.profile?.firstName} ${currentAdvisor.profile?.lastName}`,
      reason: payload.reason,
      timestamp: new Date().toISOString(),
    });

    // Notify client about advisor change
    this.server.to(`user:${clientId}`).emit('advisor_changed', {
      conversationId: payload.conversationId,
      newAdvisorId: payload.newAdvisorId,
      newAdvisorName: `${newAdvisor.profile?.firstName} ${newAdvisor.profile?.lastName}`,
      previousAdvisorName: `${currentAdvisor.profile?.firstName} ${currentAdvisor.profile?.lastName}`,
      reason: payload.reason,
      timestamp: new Date().toISOString(),
    });

    // Notify current advisor (confirmation)
    this.logger.log(
      `Conversation ${payload.conversationId} transferred from ${currentAdvisorId} to ${payload.newAdvisorId}`,
    );

    return {
      success: true,
      message: `Conversation transferred successfully to ${newAdvisor.profile?.firstName} ${newAdvisor.profile?.lastName}`,
      conversationId: payload.conversationId,
      newAdvisorId: payload.newAdvisorId,
    };
  }
}
