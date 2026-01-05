import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';
import { AuthModule } from '../infrastructure/auth/auth.module.js';

// Controllers
import { AccountController } from '../interface/http/controllers/account.controller.js';

// Services
import { IbanService } from '../infrastructure/services/iban.service.js';
import { InterestCalculationService } from './services/interest-calculation.service.js';

// Command Handlers
import { OpenAccountHandler } from './use-cases/open-account.handler.js';
import { ClientRenameAccountHandler, ClientDeleteAccountHandler } from './use-cases/client-account.handlers.js';

// Event Handlers (Projectors)
import {
  AccountOpenedHandler,
  FundsDepositedHandler,
  FundsWithdrawnHandler,
  TransferSentHandler,
  TransferReceivedHandler,
  InterestAppliedHandler,
} from './event-handlers/account-projector.js';

const CommandHandlers = [
  OpenAccountHandler,
  ClientRenameAccountHandler,
  ClientDeleteAccountHandler,
];

const EventHandlers = [
  AccountOpenedHandler,
  FundsDepositedHandler,
  FundsWithdrawnHandler,
  TransferSentHandler,
  TransferReceivedHandler,
  InterestAppliedHandler,
];

const Services = [IbanService, InterestCalculationService];

@Module({
  imports: [CqrsModule, PrismaModule, EventStoreModule, AuthModule, ScheduleModule.forRoot()],
  controllers: [AccountController],
  providers: [...CommandHandlers, ...EventHandlers, ...Services],
  exports: [IbanService, InterestCalculationService],
})
export class AccountModule {}
