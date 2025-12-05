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
exports.PlaceOrderHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const place_order_command_js_1 = require("../commands/place-order.command.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const order_matching_service_js_1 = require("../../domain/services/order-matching.service.js");
const order_aggregate_js_1 = require("../../domain/entities/order.aggregate.js");
const uuid_1 = require("uuid");
let PlaceOrderHandler = class PlaceOrderHandler {
    prisma;
    eventStore;
    matchingService;
    constructor(prisma, eventStore, matchingService) {
        this.prisma = prisma;
        this.eventStore = eventStore;
        this.matchingService = matchingService;
    }
    async execute(command) {
        const user = await this.prisma.user.findUnique({
            where: { id: command.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const account = await this.prisma.bankAccount.findFirst({
            where: {
                id: command.accountId,
                userId: command.userId,
                accountType: 'INVESTMENT',
                status: 'ACTIVE',
            },
        });
        if (!account) {
            throw new common_1.NotFoundException('Active investment account not found for this user');
        }
        const security = await this.prisma.security.findUnique({
            where: { id: command.securityId },
        });
        if (!security) {
            throw new common_1.NotFoundException('Security not found');
        }
        if (command.type !== 'BUY' && command.type !== 'SELL') {
            throw new common_1.BadRequestException('Order type must be BUY or SELL');
        }
        if (command.quantity <= 0) {
            throw new common_1.BadRequestException('Quantity must be positive');
        }
        if (command.price <= 0) {
            throw new common_1.BadRequestException('Price must be positive');
        }
        if (command.type === 'BUY') {
            const totalCost = command.quantity * command.price + 1;
            const availableBalance = Number(account.balance);
            console.log(`[PlaceOrderHandler] BUY Order Validation:`);
            console.log(`  Required: €${totalCost.toFixed(2)}`);
            console.log(`  Available: €${availableBalance.toFixed(2)}`);
            console.log(`  Sufficient: ${availableBalance >= totalCost}`);
            if (availableBalance < totalCost) {
                throw new common_1.BadRequestException(`Insufficient funds. Required: €${totalCost.toFixed(2)}, Available: €${availableBalance.toFixed(2)}`);
            }
            await this.prisma.bankAccount.update({
                where: { id: command.accountId },
                data: {
                    balance: {
                        decrement: totalCost,
                    },
                },
            });
            console.log(`[PlaceOrderHandler] Reserved €${totalCost.toFixed(2)} from account`);
        }
        if (command.type === 'SELL') {
            const portfolio = await this.prisma.portfolio.findUnique({
                where: {
                    accountId_securityId: {
                        accountId: command.accountId,
                        securityId: command.securityId,
                    },
                },
            });
            if (!portfolio || portfolio.quantity < command.quantity) {
                throw new common_1.BadRequestException(`Insufficient securities. Required: ${command.quantity}, Available: ${portfolio?.quantity || 0}`);
            }
            const newQuantity = portfolio.quantity - command.quantity;
            if (newQuantity === 0) {
                await this.prisma.portfolio.delete({
                    where: {
                        accountId_securityId: {
                            accountId: command.accountId,
                            securityId: command.securityId,
                        },
                    },
                });
            }
            else {
                await this.prisma.portfolio.update({
                    where: {
                        accountId_securityId: {
                            accountId: command.accountId,
                            securityId: command.securityId,
                        },
                    },
                    data: {
                        quantity: newQuantity,
                    },
                });
            }
        }
        const orderId = (0, uuid_1.v4)();
        const order = order_aggregate_js_1.OrderAggregate.place(orderId, command.userId, command.accountId, command.securityId, command.type, command.quantity, command.price);
        await this.eventStore.save(order, 'Order');
        const matchesFound = await this.matchingService.matchOrder(order);
        return {
            orderId,
            matchesFound,
        };
    }
};
exports.PlaceOrderHandler = PlaceOrderHandler;
exports.PlaceOrderHandler = PlaceOrderHandler = __decorate([
    (0, cqrs_1.CommandHandler)(place_order_command_js_1.PlaceOrderCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore,
        order_matching_service_js_1.OrderMatchingService])
], PlaceOrderHandler);
//# sourceMappingURL=place-order.handler.js.map