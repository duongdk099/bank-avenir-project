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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const place_order_command_js_1 = require("../../../application/commands/place-order.command.js");
const cancel_order_command_js_1 = require("../../../application/commands/cancel-order.command.js");
const prisma_service_js_1 = require("../../../infrastructure/database/prisma/prisma.service.js");
const order_matching_service_js_1 = require("../../../domain/services/order-matching.service.js");
let OrderController = class OrderController {
    commandBus;
    prisma;
    matchingService;
    constructor(commandBus, prisma, matchingService) {
        this.commandBus = commandBus;
        this.prisma = prisma;
        this.matchingService = matchingService;
    }
    async placeOrder(dto) {
        const command = new place_order_command_js_1.PlaceOrderCommand(dto.userId, dto.accountId, dto.securityId, dto.type, dto.quantity, dto.price);
        const result = await this.commandBus.execute(command);
        return {
            message: 'Order placed successfully',
            ...result,
        };
    }
    async getOrder(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                security: true,
                account: true,
            },
        });
        return order;
    }
    async getUserOrders(userId) {
        const orders = await this.prisma.order.findMany({
            where: { userId },
            include: {
                security: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return orders;
    }
    async getOrderBook(securityId) {
        const orderBook = await this.matchingService.getOrderBook(securityId);
        const bestPrices = await this.matchingService.getBestPrices(securityId);
        return {
            ...orderBook,
            ...bestPrices,
        };
    }
    async getAccountTrades(accountId) {
        const trades = await this.prisma.trade.findMany({
            where: {
                OR: [
                    { buyAccountId: accountId },
                    { sellAccountId: accountId },
                ],
            },
            include: {
                security: true,
            },
            orderBy: { executedAt: 'desc' },
        });
        return trades;
    }
    async cancelOrder(id, dto) {
        const command = new cancel_order_command_js_1.CancelOrderCommand(id, dto.userId, dto.reason);
        const result = await this.commandBus.execute(command);
        return {
            message: 'Order cancelled successfully',
            ...result,
        };
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "placeOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getUserOrders", null);
__decorate([
    (0, common_1.Get)('security/:securityId/book'),
    __param(0, (0, common_1.Param)('securityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getOrderBook", null);
__decorate([
    (0, common_1.Get)('account/:accountId/trades'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "getAccountTrades", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "cancelOrder", null);
exports.OrderController = OrderController = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        prisma_service_js_1.PrismaService,
        order_matching_service_js_1.OrderMatchingService])
], OrderController);
//# sourceMappingURL=order.controller.js.map