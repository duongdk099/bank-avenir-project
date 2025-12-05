import { ICommandHandler } from '@nestjs/cqrs';
import { PlaceOrderCommand } from '../commands/place-order.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { OrderMatchingService } from '../../domain/services/order-matching.service.js';
export declare class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
    private readonly prisma;
    private readonly eventStore;
    private readonly matchingService;
    constructor(prisma: PrismaService, eventStore: EventStore, matchingService: OrderMatchingService);
    execute(command: PlaceOrderCommand): Promise<{
        orderId: string;
        matchesFound: number;
    }>;
}
