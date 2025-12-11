import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';
import { AdminController } from '../interface/http/controllers/admin.controller.js';

// Import command handlers
import {
  CreateStockHandler,
  UpdateStockAvailabilityHandler,
  DeleteStockHandler,
} from './use-cases/manage-stock.handlers.js';

import {
  DirectorCreateAccountHandler,
  RenameAccountHandler,
  BanAccountHandler,
  CloseAccountHandler,
} from './use-cases/account-management.handlers.js';

import { IbanService } from '../infrastructure/services/iban.service.js';

const CommandHandlers = [
  CreateStockHandler,
  UpdateStockAvailabilityHandler,
  DeleteStockHandler,
  DirectorCreateAccountHandler,
  RenameAccountHandler,
  BanAccountHandler,
  CloseAccountHandler,
];

const Services = [IbanService];

@Module({
  imports: [CqrsModule, PrismaModule, EventStoreModule],
  controllers: [AdminController],
  providers: [...CommandHandlers, ...Services],
})
export class AdminModule {}
