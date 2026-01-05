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
exports.AccountController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const open_account_command_js_1 = require("../../../application/commands/open-account.command.js");
const client_account_commands_js_1 = require("../../../application/commands/client-account.commands.js");
const prisma_service_js_1 = require("../../../infrastructure/database/prisma/prisma.service.js");
const interest_calculation_service_js_1 = require("../../../application/services/interest-calculation.service.js");
const jwt_auth_guard_js_1 = require("../../../infrastructure/auth/jwt-auth.guard.js");
let AccountController = class AccountController {
    commandBus;
    prisma;
    interestService;
    constructor(commandBus, prisma, interestService) {
        this.commandBus = commandBus;
        this.prisma = prisma;
        this.interestService = interestService;
    }
    async openAccount(dto) {
        const command = new open_account_command_js_1.OpenAccountCommand(dto.userId, dto.accountType, dto.initialDeposit);
        const result = await this.commandBus.execute(command);
        return {
            message: 'Account opened successfully',
            ...result,
        };
    }
    async getAccount(id) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
            include: {
                operations: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        return account;
    }
    async getUserAccounts(userId) {
        const accounts = await this.prisma.bankAccount.findMany({
            where: { userId },
        });
        return accounts;
    }
    async calculateInterest() {
        const result = await this.interestService.calculateInterestNow();
        return {
            message: 'Interest calculation completed',
            ...result,
        };
    }
    async renameAccount(id, dto) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (account.userId !== dto.userId) {
            throw new common_1.ForbiddenException('You can only rename your own accounts');
        }
        const command = new client_account_commands_js_1.ClientRenameAccountCommand(id, dto.newName, dto.userId);
        await this.commandBus.execute(command);
        return {
            success: true,
            message: 'Account renamed successfully',
        };
    }
    async deleteAccount(id, dto) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        if (account.userId !== dto.userId) {
            throw new common_1.ForbiddenException('You can only delete your own accounts');
        }
        if (account.balance.toNumber() !== 0) {
            throw new common_1.ForbiddenException('Account must have zero balance before deletion. Please withdraw or transfer all funds.');
        }
        const command = new client_account_commands_js_1.ClientDeleteAccountCommand(id, dto.userId, dto.reason || 'Client requested deletion');
        await this.commandBus.execute(command);
        return {
            success: true,
            message: 'Account deleted successfully',
        };
    }
};
exports.AccountController = AccountController;
__decorate([
    (0, common_1.Post)('open'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "openAccount", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "getUserAccounts", null);
__decorate([
    (0, common_1.Post)('interest/calculate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "calculateInterest", null);
__decorate([
    (0, common_1.Put)(':id/rename'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "renameAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountController.prototype, "deleteAccount", null);
exports.AccountController = AccountController = __decorate([
    (0, common_1.Controller)('accounts'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        prisma_service_js_1.PrismaService,
        interest_calculation_service_js_1.InterestCalculationService])
], AccountController);
//# sourceMappingURL=account.controller.js.map