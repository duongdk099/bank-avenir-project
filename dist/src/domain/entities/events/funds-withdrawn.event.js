"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundsWithdrawnEvent = void 0;
class FundsWithdrawnEvent {
    aggregateId;
    amount;
    currency;
    balanceAfter;
    description;
    occurredOn;
    eventType = 'FUNDS_WITHDRAWN';
    constructor(aggregateId, amount, currency, balanceAfter, description, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.amount = amount;
        this.currency = currency;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.occurredOn = occurredOn;
    }
}
exports.FundsWithdrawnEvent = FundsWithdrawnEvent;
//# sourceMappingURL=funds-withdrawn.event.js.map