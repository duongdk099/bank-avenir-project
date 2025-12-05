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
exports.CancelOrderHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const cancel_order_command_js_1 = require("../commands/cancel-order.command.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const order_cancelled_event_js_1 = require("../../domain/entities/events/order-cancelled.event.js");
const cqrs_2 = require("@nestjs/cqrs");
let CancelOrderHandler = class CancelOrderHandler {
    prisma;
    eventBus;
    constructor(prisma, eventBus) {
        this.prisma = prisma;
        this.eventBus = eventBus;
    }
    async execute(command) {
        const order = await this.prisma.order.findUnique({
            where: { id: command.orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.userId !== command.userId) {
            throw new common_1.BadRequestException('You can only cancel your own orders');
        }
        if (order.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Cannot cancel order with status: ${order.status}`);
        }
        const event = new order_cancelled_event_js_1.OrderCancelledEvent(command.orderId, command.reason);
        this.eventBus.publish(event);
        return { success: true };
    }
};
exports.CancelOrderHandler = CancelOrderHandler;
exports.CancelOrderHandler = CancelOrderHandler = __decorate([
    (0, cqrs_1.CommandHandler)(cancel_order_command_js_1.CancelOrderCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        cqrs_2.EventBus])
], CancelOrderHandler);
//# sourceMappingURL=cancel-order.handler.js.map