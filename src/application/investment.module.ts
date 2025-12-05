import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';

// Controllers
import { OrderController } from '../interface/http/controllers/order.controller.js';

// Services
import { OrderMatchingService } from '../domain/services/order-matching.service.js';

// Command Handlers
import { PlaceOrderHandler } from './use-cases/place-order.handler.js';
import { CancelOrderHandler } from './use-cases/cancel-order.handler.js';

// Event Handlers (Projectors)
import {
  OrderPlacedHandler,
  OrderExecutedHandler,
  OrderCancelledHandler,
} from './event-handlers/investment-projector.js';

const CommandHandlers = [PlaceOrderHandler, CancelOrderHandler];

const EventHandlers = [
  OrderPlacedHandler,
  OrderExecutedHandler,
  OrderCancelledHandler,
];

const Services = [OrderMatchingService];

@Module({
  imports: [CqrsModule, PrismaModule, EventStoreModule],
  controllers: [OrderController],
  providers: [...CommandHandlers, ...EventHandlers, ...Services],
  exports: [OrderMatchingService],
})
export class InvestmentModule {}
