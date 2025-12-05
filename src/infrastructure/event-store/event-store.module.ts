import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventStore } from './event-store.service.js';
import { PrismaModule } from '../database/prisma/prisma.module.js';

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [EventStore],
  exports: [EventStore],
})
export class EventStoreModule {}
