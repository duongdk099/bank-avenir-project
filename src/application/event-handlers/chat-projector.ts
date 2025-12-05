import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';

/**
 * Domain Event for Private Message
 */
export class PrivateMessageSentEvent {
  constructor(
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly content: string,
    public readonly occurredOn: Date = new Date(),
  ) {}

  get eventType(): string {
    return 'PRIVATE_MESSAGE_SENT';
  }
}

/**
 * Chat Projector (Read Side)
 * Persists messages to private_messages table
 */
@Injectable()
@EventsHandler(PrivateMessageSentEvent)
export class PrivateMessageSentHandler implements IEventHandler<PrivateMessageSentEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: PrivateMessageSentEvent) {
    // Ensure conversation exists
    const conversation = await this.prisma.privateConversation.findUnique({
      where: { id: event.conversationId },
    });

    if (!conversation) {
      // Create conversation if it doesn't exist
      await this.prisma.privateConversation.create({
        data: {
          id: event.conversationId,
          user1Id: event.senderId,
          user2Id: event.receiverId,
          createdAt: event.occurredOn,
        },
      });
    }

    // Create message
    await this.prisma.message.create({
      data: {
        conversationId: event.conversationId,
        senderId: event.senderId,
        receiverId: event.receiverId,
        content: event.content,
        isRead: false,
        createdAt: event.occurredOn,
      },
    });
  }
}
