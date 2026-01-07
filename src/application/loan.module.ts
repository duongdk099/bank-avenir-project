import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';
import { AuthModule } from '../infrastructure/auth/auth.module.js';

// Controllers
import { LoanController } from '../interface/http/controllers/loan.controller.js';

// Command Handlers
import { GrantLoanHandler } from './use-cases/grant-loan.handler.js';
import {
  RequestLoanHandler,
  AssignLoanRequestHandler,
  ApproveLoanRequestHandler,
  RejectLoanRequestHandler,
} from './use-cases/loan-request.handlers.js';

// Event Handlers (Projectors)
import {
  LoanGrantedHandler,
  LoanScheduleGeneratedHandler,
} from './event-handlers/loan-projector.js';
import {
  LoanRequestedHandler,
  LoanRequestAssignedHandler,
  LoanRequestApprovedHandler,
  LoanRequestRejectedHandler,
} from './event-handlers/loan-request-projector.js';

const CommandHandlers = [
  GrantLoanHandler,
  RequestLoanHandler,
  AssignLoanRequestHandler,
  ApproveLoanRequestHandler,
  RejectLoanRequestHandler,
];

const EventHandlers = [
  LoanGrantedHandler,
  LoanScheduleGeneratedHandler,
  LoanRequestedHandler,
  LoanRequestAssignedHandler,
  LoanRequestApprovedHandler,
  LoanRequestRejectedHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, EventStoreModule, AuthModule],
  controllers: [LoanController],
  providers: [...CommandHandlers, ...EventHandlers],
})
export class LoanModule {}
