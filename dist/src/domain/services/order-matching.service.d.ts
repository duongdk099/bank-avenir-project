import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { OrderAggregate } from '../../domain/entities/order.aggregate.js';
export declare class OrderMatchingService {
    private readonly prisma;
    private readonly eventStore;
    private readonly eventBus;
    private readonly logger;
    constructor(prisma: PrismaService, eventStore: EventStore, eventBus: EventBus);
    matchOrder(newOrder: OrderAggregate): Promise<number>;
    getOrderBook(securityId: string): Promise<{
        buyOrders: any[];
        sellOrders: any[];
    }>;
    getBestPrices(securityId: string): Promise<{
        bestBid: number | null;
        bestAsk: number | null;
    }>;
}
