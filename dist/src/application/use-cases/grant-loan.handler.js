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
exports.GrantLoanHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const grant_loan_command_js_1 = require("../commands/grant-loan.command.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const loan_aggregate_js_1 = require("../../domain/entities/loan.aggregate.js");
const uuid_1 = require("uuid");
let GrantLoanHandler = class GrantLoanHandler {
    prisma;
    eventStore;
    constructor(prisma, eventStore) {
        this.prisma = prisma;
        this.eventStore = eventStore;
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
                status: 'ACTIVE',
            },
        });
        if (!account) {
            throw new common_1.NotFoundException('Active account not found for this user');
        }
        if (command.principal <= 0) {
            throw new common_1.BadRequestException('Principal must be positive');
        }
        if (command.annualRate < 0) {
            throw new common_1.BadRequestException('Annual rate cannot be negative');
        }
        if (command.termMonths <= 0 || command.termMonths > 360) {
            throw new common_1.BadRequestException('Term must be between 1 and 360 months');
        }
        if (command.insuranceRate < 0 || command.insuranceRate > 0.1) {
            throw new common_1.BadRequestException('Insurance rate must be between 0 and 0.1 (10%)');
        }
        const loanId = (0, uuid_1.v4)();
        const loan = loan_aggregate_js_1.LoanAggregate.grant(loanId, command.userId, command.accountId, command.principal, command.annualRate, command.termMonths, command.insuranceRate);
        loan.generateSchedule();
        await this.eventStore.save(loan, 'Loan');
        return {
            loanId,
            monthlyPayment: loan.getMonthlyPayment(),
            totalAmount: loan.getTotalAmount(),
        };
    }
};
exports.GrantLoanHandler = GrantLoanHandler;
exports.GrantLoanHandler = GrantLoanHandler = __decorate([
    (0, cqrs_1.CommandHandler)(grant_loan_command_js_1.GrantLoanCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore])
], GrantLoanHandler);
//# sourceMappingURL=grant-loan.handler.js.map