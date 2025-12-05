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
var InterestCalculationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterestCalculationService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const event_store_service_js_1 = require("../../infrastructure/event-store/event-store.service.js");
const bank_account_aggregate_js_1 = require("../../domain/entities/bank-account.aggregate.js");
let InterestCalculationService = InterestCalculationService_1 = class InterestCalculationService {
    prisma;
    eventStore;
    logger = new common_1.Logger(InterestCalculationService_1.name);
    constructor(prisma, eventStore) {
        this.prisma = prisma;
        this.eventStore = eventStore;
    }
    async calculateDailyInterest() {
        this.logger.log('Starting daily interest calculation job...');
        try {
            const savingsAccounts = await this.prisma.bankAccount.findMany({
                where: {
                    accountType: 'SAVINGS',
                    status: 'ACTIVE',
                },
            });
            this.logger.log(`Found ${savingsAccounts.length} active savings accounts`);
            let successCount = 0;
            let errorCount = 0;
            for (const account of savingsAccounts) {
                try {
                    await this.applyInterestToAccount(account.id);
                    successCount++;
                }
                catch (error) {
                    errorCount++;
                    this.logger.error(`Failed to apply interest to account ${account.id}: ${error.message}`, error.stack);
                }
            }
            this.logger.log(`Daily interest calculation completed. Success: ${successCount}, Errors: ${errorCount}`);
        }
        catch (error) {
            this.logger.error(`Daily interest calculation job failed: ${error.message}`, error.stack);
        }
    }
    async applyInterestToAccount(accountId) {
        const events = await this.eventStore.getEventsForAggregate(accountId, 'BankAccount');
        const account = new bank_account_aggregate_js_1.BankAccountAggregate(accountId);
        account.loadFromHistory(events);
        if (account.getAccountType() !== 'SAVINGS') {
            throw new Error('Account is not a savings account');
        }
        if (account.getStatus() !== 'ACTIVE') {
            throw new Error('Account is not active');
        }
        account.applyInterest();
        await this.eventStore.save(account, 'BankAccount');
        this.logger.debug(`Interest applied to account ${accountId}. New balance: ${account.getBalance().toString()}`);
    }
    async calculateInterestNow() {
        this.logger.log('Manual interest calculation triggered...');
        const savingsAccounts = await this.prisma.bankAccount.findMany({
            where: {
                accountType: 'SAVINGS',
                status: 'ACTIVE',
            },
        });
        let successCount = 0;
        let errorCount = 0;
        for (const account of savingsAccounts) {
            try {
                await this.applyInterestToAccount(account.id);
                successCount++;
            }
            catch (error) {
                errorCount++;
                this.logger.error(`Failed to apply interest to account ${account.id}: ${error.message}`);
            }
        }
        return { processed: successCount, errors: errorCount };
    }
};
exports.InterestCalculationService = InterestCalculationService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InterestCalculationService.prototype, "calculateDailyInterest", null);
exports.InterestCalculationService = InterestCalculationService = InterestCalculationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        event_store_service_js_1.EventStore])
], InterestCalculationService);
//# sourceMappingURL=interest-calculation.service.js.map