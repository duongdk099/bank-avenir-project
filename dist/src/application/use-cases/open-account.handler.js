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
exports.OpenAccountHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const open_account_command_js_1 = require("../commands/open-account.command.js");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const iban_service_js_1 = require("../../infrastructure/services/iban.service.js");
const bank_account_aggregate_js_1 = require("../../domain/entities/bank-account.aggregate.js");
const uuid_1 = require("uuid");
let OpenAccountHandler = class OpenAccountHandler {
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
        const initialDeposit = command.initialDeposit ?? 0;
        if (initialDeposit < 0) {
            throw new common_1.BadRequestException('Initial deposit cannot be negative');
        }
        const iban = await this.ibanService.generateIban();
        const accountId = (0, uuid_1.v4)();
        const account = bank_account_aggregate_js_1.BankAccountAggregate.open(accountId, command.userId, iban.getValue(), command.accountType, initialDeposit);
        await this.eventStore.save(account, 'BankAccount');
        return {
            accountId,
            iban: iban.getFormatted(),
        };
    }
};
exports.OpenAccountHandler = OpenAccountHandler;
exports.OpenAccountHandler = OpenAccountHandler = __decorate([
    (0, cqrs_1.CommandHandler)(open_account_command_js_1.OpenAccountCommand),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore,
        iban_service_js_1.IbanService])
], OpenAccountHandler);
//# sourceMappingURL=open-account.handler.js.map