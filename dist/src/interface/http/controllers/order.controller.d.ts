import { CommandBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { OrderMatchingService } from '../../../domain/services/order-matching.service.js';
export declare class OrderController {
    private readonly commandBus;
    private readonly prisma;
    private readonly matchingService;
    constructor(commandBus: CommandBus, prisma: PrismaService, matchingService: OrderMatchingService);
    placeOrder(req: any, dto: {
        accountId: string;
        securityId: string;
        type: string;
        quantity: number;
        price: number;
    }): Promise<any>;
    getOrder(id: string): Promise<({
        security: {
            symbol: string;
            name: string;
            id: string;
            type: string;
            currency: string;
            exchange: string | null;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            isAvailable: boolean;
            lastUpdated: Date;
        };
        account: {
            name: string | null;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            iban: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
            currency: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TradeType;
        accountId: string;
        securityId: string;
        quantity: number;
        remainingQuantity: number;
        executedQuantity: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        executedAt: Date | null;
    }) | null>;
    getMyOrders(req: any): Promise<({
        security: {
            symbol: string;
            name: string;
            id: string;
            type: string;
            currency: string;
            exchange: string | null;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            isAvailable: boolean;
            lastUpdated: Date;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TradeType;
        accountId: string;
        securityId: string;
        quantity: number;
        remainingQuantity: number;
        executedQuantity: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        executedAt: Date | null;
    })[]>;
    getUserOrders(userId: string): Promise<({
        security: {
            symbol: string;
            name: string;
            id: string;
            type: string;
            currency: string;
            exchange: string | null;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            isAvailable: boolean;
            lastUpdated: Date;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        userId: string;
        type: import("@prisma/client").$Enums.TradeType;
        accountId: string;
        securityId: string;
        quantity: number;
        remainingQuantity: number;
        executedQuantity: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        executedAt: Date | null;
    })[]>;
    getOrderBook(securityId: string): Promise<{
        bestBid: number | null;
        bestAsk: number | null;
        buyOrders: any[];
        sellOrders: any[];
    }>;
    getAccountTrades(accountId: string): Promise<({
        security: {
            symbol: string;
            name: string;
            id: string;
            type: string;
            currency: string;
            exchange: string | null;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            isAvailable: boolean;
            lastUpdated: Date;
        };
    } & {
        id: string;
        securityId: string;
        quantity: number;
        price: import("@prisma/client-runtime-utils").Decimal;
        executedAt: Date;
        buyOrderId: string;
        sellOrderId: string;
        buyAccountId: string;
        sellAccountId: string;
        commission: import("@prisma/client-runtime-utils").Decimal;
    })[]>;
    cancelOrder(req: any, id: string, dto: {
        reason?: string;
    }): Promise<any>;
}
