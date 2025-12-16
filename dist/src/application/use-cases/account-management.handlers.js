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
exports.BanAccountHandler = exports.CloseAccountHandler = exports.RenameAccountHandler = exports.DirectorCreateAccountHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const account_management_commands_js_1 = require("../commands/account-management.commands.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const bank_account_aggregate_js_1 = require("../../domain/entities/bank-account.aggregate.js");
const iban_service_js_1 = require("../../infrastructure/services/iban.service.js");
const uuid_1 = require("uuid");
let DirectorCreateAccountHandler = class DirectorCreateAccountHandler {
    prisma;
    eventStore;
    ibanService;
    constructor(prisma, eventStore, ibanService) {
        this.prisma = prisma;
        this.eventStore = eventStore;
        this.ibanService = ibanService;
    }
    async execute(command) {
        const user = await this.prisma.user.findUnique({
            where: { id: command.userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const validTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT'];
        if (!validTypes.includes(command.accountType)) {
            throw new common_1.BadRequestException(`Invalid account type. Must be one of: ${validTypes.join(', ')}`);
        }
        if (command.initialDeposit < 0) {
            throw new common_1.BadRequestException('Initial deposit cannot be negative');
        }
        const iban = await this.ibanService.generateIban();
        const accountId = (0, uuid_1.v4)();
        const account = bank_account_aggregate_js_1.BankAccountAggregate.open(accountId, command.userId, iban.getValue(), command.accountType, command.initialDeposit || 0);
        await this.eventStore.save(account, 'BankAccountAggregate');
        return { accountId, iban: iban.getValue() };
    }
};
exports.DirectorCreateAccountHandler = DirectorCreateAccountHandler;
exports.DirectorCreateAccountHandler = DirectorCreateAccountHandler = __decorate([
    (0, cqrs_1.CommandHandler)(account_management_commands_js_1.DirectorCreateAccountCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore,
        iban_service_js_1.IbanService])
], DirectorCreateAccountHandler);
let RenameAccountHandler = class RenameAccountHandler {
    prisma;
    eventStore;
    constructor(prisma, eventStore) {
        this.prisma = prisma;
        this.eventStore = eventStore;
    }
    async execute(command) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id: command.accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const requester = await this.prisma.user.findUnique({
            where: { id: command.requestedBy },
        });
        if (!requester) {
            throw new common_1.NotFoundException('User not found');
        }
        const isOwner = account.userId === command.requestedBy;
        const isAdmin = requester.role === 'ADMIN' || requester.role === 'MANAGER';
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to rename this account');
        }
        const aggregate = await this.eventStore.get(command.accountId, bank_account_aggregate_js_1.BankAccountAggregate);
        if (!aggregate) {
            throw new common_1.NotFoundException('Account aggregate not found');
        }
        aggregate.rename(command.newName);
        await this.eventStore.save(aggregate, 'BankAccount');
        return { success: true };
    }
};
exports.RenameAccountHandler = RenameAccountHandler;
exports.RenameAccountHandler = RenameAccountHandler = __decorate([
    (0, cqrs_1.CommandHandler)(account_management_commands_js_1.RenameAccountCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore])
], RenameAccountHandler);
let CloseAccountHandler = class CloseAccountHandler {
    prisma;
    eventStore;
    constructor(prisma, eventStore) {
        this.prisma = prisma;
        this.eventStore = eventStore;
    }
    async execute(command) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id: command.accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const requester = await this.prisma.user.findUnique({
            where: { id: command.requestedBy },
        });
        if (!requester) {
            throw new common_1.NotFoundException('User not found');
        }
        const isOwner = account.userId === command.requestedBy;
        const isAdmin = requester.role === 'ADMIN' || requester.role === 'MANAGER';
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to close this account');
        }
        const aggregate = await this.eventStore.get(command.accountId, bank_account_aggregate_js_1.BankAccountAggregate);
        if (!aggregate) {
            throw new common_1.NotFoundException('Account aggregate not found');
        }
        aggregate.close(command.reason);
        await this.eventStore.save(aggregate, 'BankAccount');
        return { success: true };
    }
};
exports.CloseAccountHandler = CloseAccountHandler;
exports.CloseAccountHandler = CloseAccountHandler = __decorate([
    (0, cqrs_1.CommandHandler)(account_management_commands_js_1.CloseAccountCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore])
], CloseAccountHandler);
let BanAccountHandler = class BanAccountHandler {
    prisma;
    eventStore;
    constructor(prisma, eventStore) {
        this.prisma = prisma;
        this.eventStore = eventStore;
    }
    async execute(command) {
        const director = await this.prisma.user.findUnique({
            where: { id: command.directorId },
        });
        if (!director || director.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only directors can ban accounts');
        }
        const account = await this.prisma.bankAccount.findUnique({
            where: { id: command.accountId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Account not found');
        }
        const aggregate = await this.eventStore.get(command.accountId, bank_account_aggregate_js_1.BankAccountAggregate);
        if (!aggregate) {
            throw new common_1.NotFoundException('Account aggregate not found');
        }
        aggregate.ban(command.reason);
        await this.eventStore.save(aggregate, 'BankAccount');
        return { success: true };
    }
};
exports.BanAccountHandler = BanAccountHandler;
exports.BanAccountHandler = BanAccountHandler = __decorate([
    (0, cqrs_1.CommandHandler)(account_management_commands_js_1.BanAccountCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore])
], BanAccountHandler);
//# sourceMappingURL=account-management.handlers.js.map