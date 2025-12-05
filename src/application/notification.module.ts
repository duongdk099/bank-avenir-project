import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';

// Controllers
import { NotificationController } from '../interface/http/controllers/notification.controller.js';
import { SseController } from '../interface/http/controllers/sse.controller.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [NotificationController, SseController],
  exports: [],
})
export class NotificationModule {}
