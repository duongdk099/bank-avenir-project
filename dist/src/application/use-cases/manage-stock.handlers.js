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
exports.DeleteStockHandler = exports.UpdateStockAvailabilityHandler = exports.CreateStockHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const manage_stock_commands_js_1 = require("../commands/manage-stock.commands.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
let CreateStockHandler = class CreateStockHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(command) {
        const existing = await this.prisma.security.findFirst({
            where: { symbol: command.symbol.toUpperCase() },
        });
        if (existing) {
            throw new common_1.ConflictException(`Stock with symbol ${command.symbol} already exists`);
        }
        const stock = await this.prisma.security.create({
            data: {
                symbol: command.symbol.toUpperCase(),
                name: command.name,
                type: command.type,
                exchange: command.exchange,
                currentPrice: command.currentPrice,
                currency: command.currency,
                isAvailable: true,
                lastUpdated: new Date(),
            },
        });
        return { stockId: stock.id };
    }
};
exports.CreateStockHandler = CreateStockHandler;
exports.CreateStockHandler = CreateStockHandler = __decorate([
    (0, cqrs_1.CommandHandler)(manage_stock_commands_js_1.CreateStockCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], CreateStockHandler);
let UpdateStockAvailabilityHandler = class UpdateStockAvailabilityHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(command) {
        const stock = await this.prisma.security.findFirst({
            where: { symbol: command.symbol.toUpperCase() },
        });
        if (!stock) {
            throw new common_1.NotFoundException(`Stock with symbol ${command.symbol} not found`);
        }
        await this.prisma.security.update({
            where: { id: stock.id },
            data: {
                isAvailable: command.isAvailable,
                lastUpdated: new Date(),
            },
        });
        return { success: true };
    }
};
exports.UpdateStockAvailabilityHandler = UpdateStockAvailabilityHandler;
exports.UpdateStockAvailabilityHandler = UpdateStockAvailabilityHandler = __decorate([
    (0, cqrs_1.CommandHandler)(manage_stock_commands_js_1.UpdateStockAvailabilityCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], UpdateStockAvailabilityHandler);
let DeleteStockHandler = class DeleteStockHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async execute(command) {
        const stock = await this.prisma.security.findFirst({
            where: { symbol: command.symbol.toUpperCase() },
        });
        if (!stock) {
            throw new common_1.NotFoundException(`Stock with symbol ${command.symbol} not found`);
        }
        const ordersCount = await this.prisma.order.count({
            where: { securityId: stock.id },
        });
        const portfolioCount = await this.prisma.portfolio.count({
            where: { securityId: stock.id },
        });
        if (ordersCount > 0 || portfolioCount > 0) {
            throw new common_1.ConflictException(`Cannot delete stock ${command.symbol}. It is referenced in existing orders or portfolios. Consider disabling it instead.`);
        }
        await this.prisma.security.delete({
            where: { id: stock.id },
        });
        return { success: true };
    }
};
exports.DeleteStockHandler = DeleteStockHandler;
exports.DeleteStockHandler = DeleteStockHandler = __decorate([
    (0, cqrs_1.CommandHandler)(manage_stock_commands_js_1.DeleteStockCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], DeleteStockHandler);
//# sourceMappingURL=manage-stock.handlers.js.map