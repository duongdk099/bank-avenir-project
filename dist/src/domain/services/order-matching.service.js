"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrderMatchingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderMatchingService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const order_aggregate_js_1 = require("../../domain/entities/order.aggregate.js");
let OrderMatchingService = OrderMatchingService_1 = class OrderMatchingService {
    prisma;
    eventStore;
    eventBus;
    logger = new common_1.Logger(OrderMatchingService_1.name);
    constructor(prisma, eventStore, eventBus) {
        this.prisma = prisma;
        this.eventStore = eventStore;
        this.eventBus = eventBus;
    }
    async matchOrder(newOrder) {
        if (!newOrder.isPending()) {
            this.logger.warn(`Order ${newOrder.getId()} is not pending, skipping matching`);
            return 0;
        }
        let matchesFound = 0;
        const oppositeType = newOrder.isBuyOrder() ? 'SELL' : 'BUY';
        const potentialMatches = await this.prisma.order.findMany({
            where: {
                securityId: newOrder.getSecurityId(),
                type: oppositeType,
                status: 'PENDING',
            },
            orderBy: [
                { price: oppositeType === 'SELL' ? 'asc' : 'desc' },
                { createdAt: 'asc' },
            ],
        });
        this.logger.debug(`Found ${potentialMatches.length} potential matches for order ${newOrder.getId()}`);
        for (const potentialMatch of potentialMatches) {
            if (newOrder.getRemainingQuantity() <= 0) {
                break;
            }
            const canMatch = newOrder.isBuyOrder()
                ? newOrder.getPrice() >= potentialMatch.price.toNumber()
                : newOrder.getPrice() <= potentialMatch.price.toNumber();
            if (!canMatch) {
                break;
            }
            const matchOrderEvents = await this.eventStore.getEventsForAggregate(potentialMatch.id, 'Order');
            const matchOrder = new order_aggregate_js_1.OrderAggregate(potentialMatch.id);
            matchOrder.loadFromHistory(matchOrderEvents);
            const executionQuantity = Math.min(newOrder.getRemainingQuantity(), matchOrder.getRemainingQuantity());
            const executionPrice = matchOrder.getPrice();
            try {
                newOrder.execute(matchOrder.getId(), executionQuantity, executionPrice);
                matchOrder.execute(newOrder.getId(), executionQuantity, executionPrice);
                await this.eventStore.save(newOrder, 'Order');
                await this.eventStore.save(matchOrder, 'Order');
                matchesFound++;
                this.logger.log(`Matched orders ${newOrder.getId()} and ${matchOrder.getId()}: ` +
                    `${executionQuantity} shares at ${executionPrice}€`);
            }
            catch (error) {
                this.logger.error(`Error executing match between ${newOrder.getId()} and ${matchOrder.getId()}: ${error.message}`, error.stack);
            }
        }
        return matchesFound;
    }
    async getOrderBook(securityId) {
        const buyOrders = await this.prisma.order.findMany({
            where: {
                securityId,
                type: 'BUY',
                status: 'PENDING',
            },
            orderBy: [
                { price: 'desc' },
                { createdAt: 'asc' },
            ],
            take: 10,
        });
        const sellOrders = await this.prisma.order.findMany({
            where: {
                securityId,
                type: 'SELL',
                status: 'PENDING',
            },
            orderBy: [
                { price: 'asc' },
                { createdAt: 'asc' },
            ],
            take: 10,
        });
        return {
            buyOrders: buyOrders.map(o => ({
                price: o.price.toNumber(),
                quantity: o.quantity,
                remainingQuantity: o.remainingQuantity,
            })),
            sellOrders: sellOrders.map(o => ({
                price: o.price.toNumber(),
                quantity: o.quantity,
                remainingQuantity: o.remainingQuantity,
            })),
        };
    }
    async getBestPrices(securityId) {
        const bestBuy = await this.prisma.order.findFirst({
            where: {
                securityId,
                type: 'BUY',
                status: 'PENDING',
            },
            orderBy: { price: 'desc' },
        });
        const bestSell = await this.prisma.order.findFirst({
            where: {
                securityId,
                type: 'SELL',
                status: 'PENDING',
            },
            orderBy: { price: 'asc' },
        });
        return {
            bestBid: bestBuy ? bestBuy.price.toNumber() : null,
            bestAsk: bestSell ? bestSell.price.toNumber() : null,
        };
    }
};
exports.OrderMatchingService = OrderMatchingService;
exports.OrderMatchingService = OrderMatchingService = OrderMatchingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore,
        cqrs_1.EventBus])
], OrderMatchingService);
//# sourceMappingURL=order-matching.service.js.map