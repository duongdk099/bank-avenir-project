"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundsDepositedEvent = void 0;
class FundsDepositedEvent {
    aggregateId;
    amount;
    currency;
    balanceAfter;
    description;
    occurredOn;
    eventType = 'FUNDS_DEPOSITED';
    constructor(aggregateId, amount, currency, balanceAfter, description, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.amount = amount;
        this.currency = currency;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.occurredOn = occurredOn;
    }
}
exports.FundsDepositedEvent = FundsDepositedEvent;
//# sourceMappingURL=funds-deposited.event.js.map