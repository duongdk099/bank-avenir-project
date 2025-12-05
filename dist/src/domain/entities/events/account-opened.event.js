"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountOpenedEvent = void 0;
class AccountOpenedEvent {
    aggregateId;
    userId;
    iban;
    accountType;
    initialBalance;
    currency;
    occurredOn;
    eventType = 'ACCOUNT_OPENED';
    constructor(aggregateId, userId, iban, accountType, initialBalance, currency, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.userId = userId;
        this.iban = iban;
        this.accountType = accountType;
        this.initialBalance = initialBalance;
        this.currency = currency;
        this.occurredOn = occurredOn;
    }
}
exports.AccountOpenedEvent = AccountOpenedEvent;
//# sourceMappingURL=account-opened.event.js.map