import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';

// Controllers
import { LoanController } from '../interface/http/controllers/loan.controller.js';

// Command Handlers
import { GrantLoanHandler } from './use-cases/grant-loan.handler.js';

// Event Handlers (Projectors)
import {
  LoanGrantedHandler,
  LoanScheduleGeneratedHandler,
} from './event-handlers/loan-projector.js';

const CommandHandlers = [GrantLoanHandler];

const EventHandlers = [LoanGrantedHandler, LoanScheduleGeneratedHandler];

@Module({
  imports: [CqrsModule, PrismaModule, EventStoreModule],
  controllers: [LoanController],
  providers: [...CommandHandlers, ...EventHandlers],
})
export class LoanModule {}
