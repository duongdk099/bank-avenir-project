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
exports.LoanController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const grant_loan_command_js_1 = require("../../../application/commands/grant-loan.command.js");
const prisma_service_js_1 = require("../../../infrastructure/database/prisma/prisma.service.js");
let LoanController = class LoanController {
    commandBus;
    prisma;
    constructor(commandBus, prisma) {
        this.commandBus = commandBus;
        this.prisma = prisma;
    }
    async grantLoan(dto) {
        const command = new grant_loan_command_js_1.GrantLoanCommand(dto.userId, dto.accountId, dto.principal, dto.annualRate, dto.termMonths, dto.insuranceRate);
        const result = await this.commandBus.execute(command);
        return {
            message: 'Loan granted successfully',
            ...result,
        };
    }
    async getLoan(id) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: {
                account: true,
            },
        });
        return loan;
    }
    async getLoanSchedule(id) {
        const schedules = await this.prisma.loanSchedule.findMany({
            where: { loanId: id },
            orderBy: { installmentNumber: 'asc' },
        });
        return schedules;
    }
    async getUserLoans(userId) {
        const loans = await this.prisma.loan.findMany({
            where: { userId },
            include: {
                account: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return loans;
    }
    async calculatePayment(dto) {
        const monthlyRate = dto.annualRate / 12;
        let monthlyPaymentWithoutInsurance;
        if (monthlyRate === 0) {
            monthlyPaymentWithoutInsurance = dto.principal / dto.termMonths;
        }
        else {
            monthlyPaymentWithoutInsurance =
                (dto.principal * monthlyRate) /
                    (1 - Math.pow(1 + monthlyRate, -dto.termMonths));
        }
        const monthlyInsurance = (dto.principal * dto.insuranceRate) / dto.termMonths;
        const totalMonthlyPayment = monthlyPaymentWithoutInsurance + monthlyInsurance;
        const totalAmount = totalMonthlyPayment * dto.termMonths;
        const totalInterest = totalAmount - dto.principal - (monthlyInsurance * dto.termMonths);
        return {
            monthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
            monthlyPaymentWithoutInsurance: Math.round(monthlyPaymentWithoutInsurance * 100) / 100,
            monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            totalInsurance: Math.round(monthlyInsurance * dto.termMonths * 100) / 100,
        };
    }
};
exports.LoanController = LoanController;
__decorate([
    (0, common_1.Post)('grant'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LoanController.prototype, "grantLoan", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoanController.prototype, "getLoan", null);
__decorate([
    (0, common_1.Get)(':id/schedule'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoanController.prototype, "getLoanSchedule", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoanController.prototype, "getUserLoans", null);
__decorate([
    (0, common_1.Post)(':id/calculate-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LoanController.prototype, "calculatePayment", null);
exports.LoanController = LoanController = __decorate([
    (0, common_1.Controller)('loans'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        prisma_service_js_1.PrismaService])
], LoanController);
//# sourceMappingURL=loan.controller.js.map