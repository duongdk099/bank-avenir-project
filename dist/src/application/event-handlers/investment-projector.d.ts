import { IEventHandler } from '@nestjs/cqrs';
import { OrderPlacedEvent } from '../../domain/entities/events/order-placed.event.js';
import { OrderExecutedEvent } from '../../domain/entities/events/order-executed.event.js';
import { OrderCancelledEvent } from '../../domain/entities/events/order-cancelled.event.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
export declare class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: OrderPlacedEvent): Promise<void>;
}
export declare class OrderExecutedHandler implements IEventHandler<OrderExecutedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: OrderExecutedEvent): Promise<void>;
    private updatePortfolio;
}
export declare class OrderCancelledHandler implements IEventHandler<OrderCancelledEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: OrderCancelledEvent): Promise<void>;
}
