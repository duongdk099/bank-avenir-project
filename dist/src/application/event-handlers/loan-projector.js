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
exports.LoanScheduleGeneratedHandler = exports.LoanGrantedHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const loan_granted_event_js_1 = require("../../domain/entities/events/loan-granted.event.js");
const loan_schedule_generated_event_js_1 = require("../../domain/entities/events/loan-schedule-generated.event.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
let LoanGrantedHandler = class LoanGrantedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        await this.prisma.loan.create({
            data: {
                id: event.aggregateId,
                userId: event.userId,
                accountId: event.accountId,
                amount: event.principal,
                interestRate: event.annualRate,
                insuranceRate: event.insuranceRate,
                durationMonths: event.termMonths,
                monthlyPayment: event.monthlyPayment,
                status: 'ACTIVE',
                createdAt: event.occurredOn,
                approvalDate: event.occurredOn,
            },
        });
        await this.prisma.bankAccount.update({
            where: { id: event.accountId },
            data: {
                balance: {
                    increment: event.principal,
                },
            },
        });
    }
};
exports.LoanGrantedHandler = LoanGrantedHandler;
exports.LoanGrantedHandler = LoanGrantedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(loan_granted_event_js_1.LoanGrantedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], LoanGrantedHandler);
let LoanScheduleGeneratedHandler = class LoanScheduleGeneratedHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        const scheduleData = event.schedule.map((payment) => ({
            loanId: event.aggregateId,
            installmentNumber: payment.month,
            principalAmount: payment.principal,
            interestAmount: payment.interest,
            insuranceAmount: payment.insurance,
            totalAmount: payment.totalPayment,
            dueDate: this.calculateDueDate(event.occurredOn, payment.month),
            isPaid: false,
        }));
        await this.prisma.loanSchedule.createMany({
            data: scheduleData,
        });
    }
    calculateDueDate(startDate, monthOffset) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + monthOffset);
        return dueDate;
    }
};
exports.LoanScheduleGeneratedHandler = LoanScheduleGeneratedHandler;
exports.LoanScheduleGeneratedHandler = LoanScheduleGeneratedHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(loan_schedule_generated_event_js_1.LoanScheduleGeneratedEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], LoanScheduleGeneratedHandler);
//# sourceMappingURL=loan-projector.js.map