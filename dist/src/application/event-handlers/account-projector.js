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
exports.InterestAppliedHandler = exports.TransferReceivedHandler = exports.TransferSentHandler = exports.FundsWithdrawnHandler = exports.FundsDepositedHandler = exports.AccountOpenedHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const account_opened_event_js_1 = require("../../domain/entities/events/account-opened.event.js");
const funds_deposited_event_js_1 = require("../../domain/entities/events/funds-deposited.event.js");
const funds_withdrawn_event_js_1 = require("../../domain/entities/events/funds-withdrawn.event.js");
const transfer_sent_event_js_1 = require("../../domain/entities/events/transfer-sent.event.js");
const transfer_received_event_js_1 = require("../../domain/entities/events/transfer-received.event.js");
const interest_applied_event_js_1 = require("../../domain/entities/events/interest-applied.event.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
let AccountOpenedHandler = class AccountOpenedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.bankAccount.create({
            data: {
                id: event.aggregateId,
                userId: event.userId,
                iban: event.iban,
                accountType: event.accountType,
                balance: event.initialBalance,
                currency: event.currency,
                status: 'ACTIVE',
            },
        });
        if (event.initialBalance > 0) {
            await this.prisma.accountOperations.create({
                data: {
                    accountId: event.aggregateId,
                    type: client_1.OperationType.DEPOSIT,
                    amount: event.initialBalance,
                    balanceAfter: event.initialBalance,
                    description: 'Initial deposit',
                    createdAt: event.occurredOn,
                },
            });
        }
    }
};
exports.AccountOpenedHandler = AccountOpenedHandler;
exports.AccountOpenedHandler = AccountOpenedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(account_opened_event_js_1.AccountOpenedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], AccountOpenedHandler);
let FundsDepositedHandler = class FundsDepositedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.bankAccount.update({
            where: { id: event.aggregateId },
            data: { balance: event.balanceAfter },
        });
        await this.prisma.accountOperations.create({
            data: {
                accountId: event.aggregateId,
                type: client_1.OperationType.DEPOSIT,
                amount: event.amount,
                balanceAfter: event.balanceAfter,
                description: event.description,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.FundsDepositedHandler = FundsDepositedHandler;
exports.FundsDepositedHandler = FundsDepositedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(funds_deposited_event_js_1.FundsDepositedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], FundsDepositedHandler);
let FundsWithdrawnHandler = class FundsWithdrawnHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.bankAccount.update({
            where: { id: event.aggregateId },
            data: { balance: event.balanceAfter },
        });
        await this.prisma.accountOperations.create({
            data: {
                accountId: event.aggregateId,
                type: client_1.OperationType.WITHDRAWAL,
                amount: event.amount,
                balanceAfter: event.balanceAfter,
                description: event.description,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.FundsWithdrawnHandler = FundsWithdrawnHandler;
exports.FundsWithdrawnHandler = FundsWithdrawnHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(funds_withdrawn_event_js_1.FundsWithdrawnEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], FundsWithdrawnHandler);
let TransferSentHandler = class TransferSentHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.bankAccount.update({
            where: { id: event.aggregateId },
            data: { balance: event.balanceAfter },
        });
        await this.prisma.accountOperations.create({
            data: {
                accountId: event.aggregateId,
                type: client_1.OperationType.TRANSFER,
                amount: event.amount,
                balanceAfter: event.balanceAfter,
                description: event.description,
                recipientIban: event.recipientIban,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.TransferSentHandler = TransferSentHandler;
exports.TransferSentHandler = TransferSentHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(transfer_sent_event_js_1.TransferSentEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], TransferSentHandler);
let TransferReceivedHandler = class TransferReceivedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.bankAccount.update({
            where: { id: event.aggregateId },
            data: { balance: event.balanceAfter },
        });
        await this.prisma.accountOperations.create({
            data: {
                accountId: event.aggregateId,
                type: client_1.OperationType.TRANSFER,
                amount: event.amount,
                balanceAfter: event.balanceAfter,
                description: event.description,
                senderIban: event.senderIban,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.TransferReceivedHandler = TransferReceivedHandler;
exports.TransferReceivedHandler = TransferReceivedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(transfer_received_event_js_1.TransferReceivedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], TransferReceivedHandler);
let InterestAppliedHandler = class InterestAppliedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.bankAccount.update({
            where: { id: event.aggregateId },
            data: { balance: event.balanceAfter },
        });
        await this.prisma.accountOperations.create({
            data: {
                accountId: event.aggregateId,
                type: client_1.OperationType.DEPOSIT,
                amount: event.interestAmount,
                balanceAfter: event.balanceAfter,
                description: `Daily interest applied (${(event.rate * 100).toFixed(2)}% APR)`,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.InterestAppliedHandler = InterestAppliedHandler;
exports.InterestAppliedHandler = InterestAppliedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(interest_applied_event_js_1.InterestAppliedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], InterestAppliedHandler);
//# sourceMappingURL=account-projector.js.map