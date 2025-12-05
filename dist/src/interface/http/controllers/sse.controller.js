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
exports.SseController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const rxjs_1 = require("rxjs");
const prisma_service_js_1 = require("../../../infrastructure/database/prisma/prisma.service.js");
let SseController = class SseController {
    prisma;
    eventBus;
    notificationStreams = new Map();
    constructor(prisma, eventBus) {
        this.prisma = prisma;
        this.eventBus = eventBus;
        this.setupEventListeners();
    }
    streamNotifications(userId) {
        if (!userId) {
            throw new Error('userId is required');
        }
        if (!this.notificationStreams.has(userId)) {
            this.notificationStreams.set(userId, new rxjs_1.Subject());
        }
        const stream = this.notificationStreams.get(userId);
        setTimeout(() => {
            stream.next({
                data: JSON.stringify({
                    type: 'CONNECTED',
                    message: 'Notification stream connected',
                    timestamp: new Date().toISOString(),
                }),
            });
        }, 100);
        return stream.asObservable();
    }
    setupEventListeners() {
        const eventBus$ = this.eventBus?.subject$ || new rxjs_1.Subject();
        eventBus$.subscribe((event) => {
            this.handleDomainEvent(event);
        });
    }
    async handleDomainEvent(event) {
        const eventType = event.eventType || event.constructor.name;
        switch (eventType) {
            case 'ORDER_EXECUTED':
                await this.notifyOrderExecution(event);
                break;
            case 'LOAN_GRANTED':
                await this.notifyLoanGranted(event);
                break;
            case 'SAVINGS_RATE_CHANGED':
                await this.notifySavingsRateChanged(event);
                break;
            case 'PRIVATE_MESSAGE_SENT':
                await this.notifyNewMessage(event);
                break;
            case 'ACCOUNT_CREDITED':
            case 'ACCOUNT_DEBITED':
                await this.notifyBalanceChange(event);
                break;
            default:
                break;
        }
    }
    async notifyOrderExecution(event) {
        const order = await this.prisma.order.findUnique({
            where: { id: event.aggregateId },
            include: { security: true },
        });
        if (order) {
            this.pushNotification(order.userId, {
                type: 'ORDER_EXECUTED',
                title: 'Order Executed',
                message: `Your ${order.type} order for ${event.executedQuantity} shares of ${order.security.symbol} has been executed at €${event.executedPrice}`,
                data: {
                    orderId: order.id,
                    securitySymbol: order.security.symbol,
                    quantity: event.executedQuantity,
                    price: event.executedPrice,
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
    async notifyLoanGranted(event) {
        this.pushNotification(event.userId, {
            type: 'LOAN_GRANTED',
            title: 'Loan Approved',
            message: `Your loan of €${event.principal} has been approved and credited to your account`,
            data: {
                loanId: event.aggregateId,
                amount: event.principal,
                monthlyPayment: event.monthlyPayment,
            },
            timestamp: new Date().toISOString(),
        });
    }
    async notifySavingsRateChanged(event) {
        const savingsAccounts = await this.prisma.bankAccount.findMany({
            where: { accountType: 'SAVINGS' },
            select: { userId: true },
            distinct: ['userId'],
        });
        const notification = {
            type: 'SAVINGS_RATE_CHANGED',
            title: 'Savings Rate Updated',
            message: `The savings interest rate has been updated to ${event.newRate * 100}%`,
            data: {
                oldRate: event.oldRate,
                newRate: event.newRate,
                effectiveDate: event.effectiveDate,
            },
            timestamp: new Date().toISOString(),
        };
        savingsAccounts.forEach((account) => {
            this.pushNotification(account.userId, notification);
        });
    }
    async notifyNewMessage(event) {
        const sender = await this.prisma.user.findUnique({
            where: { id: event.senderId },
            include: { profile: true },
        });
        if (sender) {
            this.pushNotification(event.receiverId, {
                type: 'NEW_MESSAGE',
                title: 'New Message',
                message: `${sender.profile?.firstName} ${sender.profile?.lastName}: ${event.content.substring(0, 50)}...`,
                data: {
                    conversationId: event.conversationId,
                    senderId: event.senderId,
                    senderName: `${sender.profile?.firstName} ${sender.profile?.lastName}`,
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
    async notifyBalanceChange(event) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id: event.accountId },
        });
        if (account) {
            this.pushNotification(account.userId, {
                type: event.eventType,
                title: event.eventType === 'ACCOUNT_CREDITED' ? 'Account Credited' : 'Account Debited',
                message: `Your account has been ${event.eventType === 'ACCOUNT_CREDITED' ? 'credited' : 'debited'} €${event.amount}`,
                data: {
                    accountId: event.accountId,
                    amount: event.amount,
                    newBalance: account.balance,
                },
                timestamp: new Date().toISOString(),
            });
        }
    }
    pushNotification(userId, notification) {
        const stream = this.notificationStreams.get(userId);
        if (stream) {
            stream.next({
                data: JSON.stringify(notification),
            });
            this.prisma.notification.create({
                data: {
                    userId,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    isRead: false,
                },
            }).catch((err) => {
                console.error('Failed to persist notification:', err);
            });
        }
    }
    onModuleDestroy() {
        this.notificationStreams.forEach((stream) => stream.complete());
        this.notificationStreams.clear();
    }
};
exports.SseController = SseController;
__decorate([
    (0, common_1.Sse)('notifications'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], SseController.prototype, "streamNotifications", null);
exports.SseController = SseController = __decorate([
    (0, common_1.Controller)('sse'),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        cqrs_1.EventBus])
], SseController);
//# sourceMappingURL=sse.controller.js.map