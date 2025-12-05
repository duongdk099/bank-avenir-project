import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';

// Controllers
import { MessageController } from '../interface/http/controllers/message.controller.js';

// WebSocket Gateway
import { ChatGateway } from '../interface/websocket/chat.gateway.js';

// Event Handlers (Projectors)
import { PrivateMessageSentHandler } from './event-handlers/chat-projector.js';

const EventHandlers = [PrivateMessageSentHandler];

@Module({
  imports: [CqrsModule, PrismaModule, EventStoreModule],
  controllers: [MessageController],
  providers: [ChatGateway, ...EventHandlers],
  exports: [ChatGateway],
})
export class ChatModule {}
