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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCancelledHandler = exports.OrderExecutedHandler = exports.OrderPlacedHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const order_placed_event_js_1 = require("../../domain/entities/events/order-placed.event.js");
const order_executed_event_js_1 = require("../../domain/entities/events/order-executed.event.js");
const order_cancelled_event_js_1 = require("../../domain/entities/events/order-cancelled.event.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
let OrderPlacedHandler = class OrderPlacedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.order.create({
            data: {
                id: event.aggregateId,
                userId: event.userId,
                accountId: event.accountId,
                securityId: event.securityId,
                type: event.type,
                quantity: event.quantity,
                price: event.price,
                status: event.status,
                remainingQuantity: event.quantity,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.OrderPlacedHandler = OrderPlacedHandler;
exports.OrderPlacedHandler = OrderPlacedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(order_placed_event_js_1.OrderPlacedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], OrderPlacedHandler);
let OrderExecutedHandler = class OrderExecutedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        const order = await this.prisma.order.findUnique({
            where: { id: event.aggregateId },
        });
        if (!order) {
            throw new Error(`Order ${event.aggregateId} not found`);
        }
        const newRemainingQuantity = order.remainingQuantity - event.executedQuantity;
        const newStatus = newRemainingQuantity <= 0 ? 'EXECUTED' : 'PENDING';
        await this.prisma.order.update({
            where: { id: event.aggregateId },
            data: {
                remainingQuantity: newRemainingQuantity,
                status: newStatus,
            },
        });
        await this.prisma.trade.create({
            data: {
                buyOrderId: order.type === 'BUY' ? event.aggregateId : event.matchedOrderId,
                sellOrderId: order.type === 'SELL' ? event.aggregateId : event.matchedOrderId,
                buyAccountId: order.type === 'BUY' ? order.accountId : (await this.prisma.order.findUnique({ where: { id: event.matchedOrderId } }))?.accountId || '',
                sellAccountId: order.type === 'SELL' ? order.accountId : (await this.prisma.order.findUnique({ where: { id: event.matchedOrderId } }))?.accountId || '',
                securityId: order.securityId,
                quantity: event.executedQuantity,
                price: event.executedPrice,
                commission: event.fee,
                executedAt: event.occurredOn,
            },
        });
        await this.prisma.security.update({
            where: { id: order.securityId },
            data: {
                currentPrice: event.executedPrice,
                lastUpdated: event.occurredOn,
            },
        });
        const buyOrder = order.type === 'BUY' ? order : await this.prisma.order.findUnique({
            where: { id: event.matchedOrderId },
        });
        const sellOrder = order.type === 'SELL' ? order : await this.prisma.order.findUnique({
            where: { id: event.matchedOrderId },
        });
        if (buyOrder && sellOrder) {
            await this.updatePortfolio(buyOrder.accountId, order.securityId, event.executedQuantity, event.executedPrice, 'ADD');
            const actualBuyerCost = event.executedQuantity * event.executedPrice + event.fee;
            const reservedBuyerCost = event.executedQuantity * buyOrder.price.toNumber() + event.fee;
            if (reservedBuyerCost > actualBuyerCost) {
                const refund = reservedBuyerCost - actualBuyerCost;
                await this.prisma.bankAccount.update({
                    where: { id: buyOrder.accountId },
                    data: {
                        balance: {
                            increment: refund,
                        },
                    },
                });
            }
            const sellerProceeds = event.executedQuantity * event.executedPrice - event.fee;
            await this.prisma.bankAccount.update({
                where: { id: sellOrder.accountId },
                data: {
                    balance: {
                        increment: sellerProceeds,
                    },
                },
            });
        }
    }
    async updatePortfolio(accountId, securityId, quantity, pricePerUnit, operation) {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: {
                accountId_securityId: {
                    accountId,
                    securityId,
                },
            },
        });
        if (portfolio) {
            const newQuantity = operation === 'ADD'
                ? portfolio.quantity + quantity
                : portfolio.quantity - quantity;
            if (newQuantity <= 0) {
                await this.prisma.portfolio.delete({
                    where: {
                        accountId_securityId: {
                            accountId,
                            securityId,
                        },
                    },
                });
            }
            else {
                await this.prisma.portfolio.update({
                    where: {
                        accountId_securityId: {
                            accountId,
                            securityId,
                        },
                    },
                    data: { quantity: newQuantity },
                });
            }
        }
        else if (operation === 'ADD') {
            await this.prisma.portfolio.create({
                data: {
                    accountId,
                    securityId,
                    quantity,
                    avgPurchasePrice: pricePerUnit,
                    totalCost: quantity * pricePerUnit,
                },
            });
        }
    }
};
exports.OrderExecutedHandler = OrderExecutedHandler;
exports.OrderExecutedHandler = OrderExecutedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(order_executed_event_js_1.OrderExecutedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], OrderExecutedHandler);
let OrderCancelledHandler = class OrderCancelledHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        const order = await this.prisma.order.findUnique({
            where: { id: event.aggregateId },
        });
        if (!order) {
            throw new Error(`Order ${event.aggregateId} not found`);
        }
        await this.prisma.order.update({
            where: { id: event.aggregateId },
            data: {
                status: 'CANCELLED',
            },
        });
        if (order.type === 'BUY' && order.remainingQuantity > 0) {
            const refundAmount = order.remainingQuantity * order.price.toNumber() + 1;
            await this.prisma.bankAccount.update({
                where: { id: order.accountId },
                data: {
                    balance: {
                        increment: refundAmount,
                    },
                },
            });
        }
        if (order.type === 'SELL' && order.remainingQuantity > 0) {
            const existingPortfolio = await this.prisma.portfolio.findUnique({
                where: {
                    accountId_securityId: {
                        accountId: order.accountId,
                        securityId: order.securityId,
                    },
                },
            });
            if (existingPortfolio) {
                await this.prisma.portfolio.update({
                    where: {
                        accountId_securityId: {
                            accountId: order.accountId,
                            securityId: order.securityId,
                        },
                    },
                    data: {
                        quantity: {
                            increment: order.remainingQuantity,
                        },
                    },
                });
            }
            else {
                await this.prisma.portfolio.create({
                    data: {
                        accountId: order.accountId,
                        securityId: order.securityId,
                        quantity: order.remainingQuantity,
                        avgPurchasePrice: 0,
                        totalCost: 0,
                    },
                });
            }
        }
    }
};
exports.OrderCancelledHandler = OrderCancelledHandler;
exports.OrderCancelledHandler = OrderCancelledHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(order_cancelled_event_js_1.OrderCancelledEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], OrderCancelledHandler);
//# sourceMappingURL=investment-projector.js.map