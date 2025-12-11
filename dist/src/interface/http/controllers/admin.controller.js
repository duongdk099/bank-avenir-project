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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_service_js_1 = require("../../../infrastructure/database/prisma/prisma.service.js");
const jwt_auth_guard_js_1 = require("../../../infrastructure/auth/jwt-auth.guard.js");
const roles_guard_js_1 = require("../../../infrastructure/auth/guards/roles.guard.js");
const roles_decorator_js_1 = require("../../../infrastructure/auth/decorators/roles.decorator.js");
const manage_stock_commands_js_1 = require("../../../application/commands/manage-stock.commands.js");
const account_management_commands_js_1 = require("../../../application/commands/account-management.commands.js");
let AdminController = class AdminController {
    prisma;
    commandBus;
    constructor(prisma, commandBus) {
        this.prisma = prisma;
        this.commandBus = commandBus;
    }
    async createSecurity(dto) {
        const security = await this.prisma.security.create({
            data: {
                symbol: dto.symbol.toUpperCase(),
                name: dto.name,
                type: dto.type,
                exchange: dto.exchange,
                currentPrice: dto.currentPrice,
                currency: dto.currency || 'EUR',
                lastUpdated: new Date(),
            },
        });
        return {
            message: 'Security created successfully',
            security,
        };
    }
    async updateSecurityPrice(id, dto) {
        const security = await this.prisma.security.update({
            where: { id },
            data: {
                currentPrice: dto.price,
                lastUpdated: new Date(),
            },
        });
        return {
            message: 'Security price updated',
            security,
        };
    }
    async getAllSecurities() {
        return await this.prisma.security.findMany({
            orderBy: { symbol: 'asc' },
        });
    }
    async updateSavingsRate(dto) {
        const savingsRate = await this.prisma.savingsRate.create({
            data: {
                accountType: dto.accountType,
                rate: dto.rate,
                minBalance: dto.minBalance,
                effectiveDate: new Date(dto.effectiveDate),
            },
        });
        return {
            message: 'Savings rate updated successfully',
            savingsRate,
        };
    }
    async getSavingsRates() {
        return await this.prisma.savingsRate.findMany({
            orderBy: { effectiveDate: 'desc' },
            take: 10,
        });
    }
    async updateUserRole(id, dto) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { role: dto.role },
        });
        return {
            message: 'User role updated',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }
    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            include: {
                profile: true,
                accounts: {
                    select: {
                        id: true,
                        iban: true,
                        accountType: true,
                        balance: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return users.map((user) => ({
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            profile: user.profile,
            accountsCount: user.accounts.length,
            accounts: user.accounts,
            createdAt: user.createdAt,
        }));
    }
    async getDashboardStats() {
        const [totalUsers, totalAccounts, totalOrders, totalLoans, pendingOrders, activeLoans,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.bankAccount.count(),
            this.prisma.order.count(),
            this.prisma.loan.count(),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.loan.count({ where: { status: 'ACTIVE' } }),
        ]);
        const accountsSum = await this.prisma.bankAccount.aggregate({
            _sum: { balance: true },
        });
        return {
            users: {
                total: totalUsers,
            },
            accounts: {
                total: totalAccounts,
                totalBalance: accountsSum._sum.balance || 0,
            },
            orders: {
                total: totalOrders,
                pending: pendingOrders,
            },
            loans: {
                total: totalLoans,
                active: activeLoans,
            },
        };
    }
    async createStock(dto) {
        const existing = await this.prisma.security.findUnique({
            where: { symbol: dto.symbol.toUpperCase() },
        });
        if (existing) {
            throw new common_1.ConflictException(`Stock with symbol ${dto.symbol} already exists`);
        }
        const command = new manage_stock_commands_js_1.CreateStockCommand(dto.symbol, dto.name, dto.type, dto.exchange, dto.currentPrice, dto.currency || 'USD');
        const result = await this.commandBus.execute(command);
        return {
            message: 'Stock created successfully',
            ...result,
        };
    }
    async updateStockAvailability(symbol, dto) {
        const stock = await this.prisma.security.findUnique({
            where: { symbol: symbol.toUpperCase() },
        });
        if (!stock) {
            throw new common_1.NotFoundException(`Stock with symbol ${symbol} not found`);
        }
        const command = new manage_stock_commands_js_1.UpdateStockAvailabilityCommand(symbol, dto.isAvailable);
        await this.commandBus.execute(command);
        return {
            success: true,
            message: `Stock ${symbol} is now ${dto.isAvailable ? 'available' : 'unavailable'} for trading`,
        };
    }
    async deleteStock(symbol) {
        const stock = await this.prisma.security.findUnique({
            where: { symbol: symbol.toUpperCase() },
        });
        if (!stock) {
            throw new common_1.NotFoundException(`Stock with symbol ${symbol} not found`);
        }
        const command = new manage_stock_commands_js_1.DeleteStockCommand(symbol);
        await this.commandBus.execute(command);
        return {
            success: true,
            message: `Stock ${symbol} deleted successfully`,
        };
    }
    async createAccountForClient(dto) {
        const command = new account_management_commands_js_1.DirectorCreateAccountCommand(dto.userId, dto.accountType, dto.initialDeposit, dto.name);
        const result = await this.commandBus.execute(command);
        return {
            message: 'Account created successfully',
            accountId: result.accountId,
            iban: result.iban,
        };
    }
    async renameAccount(id, dto) {
        const command = new account_management_commands_js_1.RenameAccountCommand(id, dto.newName, dto.requestedBy);
        await this.commandBus.execute(command);
        return {
            success: true,
            message: 'Account renamed successfully',
        };
    }
    async banAccount(id, dto) {
        const command = new account_management_commands_js_1.BanAccountCommand(id, dto.reason, dto.bannedBy);
        await this.commandBus.execute(command);
        return {
            success: true,
            message: 'Account banned successfully',
        };
    }
    async closeAccount(id, dto) {
        const command = new account_management_commands_js_1.CloseAccountCommand(id, dto.reason, dto.closedBy);
        await this.commandBus.execute(command);
        return {
            success: true,
            message: 'Account closed successfully',
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('securities'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSecurity", null);
__decorate([
    (0, common_1.Put)('securities/:id/price'),
    (0, roles_decorator_js_1.Roles)('ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSecurityPrice", null);
__decorate([
    (0, common_1.Get)('securities'),
    (0, roles_decorator_js_1.Roles)('ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllSecurities", null);
__decorate([
    (0, common_1.Post)('savings-rate'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSavingsRate", null);
__decorate([
    (0, common_1.Get)('savings-rates'),
    (0, roles_decorator_js_1.Roles)('ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSavingsRates", null);
__decorate([
    (0, common_1.Put)('users/:id/role'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_js_1.Roles)('ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_js_1.Roles)('ADMIN', 'MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Post)('stocks'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createStock", null);
__decorate([
    (0, common_1.Put)('stocks/:symbol/availability'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateStockAvailability", null);
__decorate([
    (0, common_1.Delete)('stocks/:symbol'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteStock", null);
__decorate([
    (0, common_1.Post)('accounts/create'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createAccountForClient", null);
__decorate([
    (0, common_1.Put)('accounts-rename/:id'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "renameAccount", null);
__decorate([
    (0, common_1.Put)('accounts/:id/ban'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banAccount", null);
__decorate([
    (0, common_1.Delete)('accounts/:id'),
    (0, roles_decorator_js_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "closeAccount", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard, roles_guard_js_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        cqrs_1.CommandBus])
], AdminController);
//# sourceMappingURL=admin.controller.js.map