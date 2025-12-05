"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterestAppliedEvent = void 0;
class InterestAppliedEvent {
    aggregateId;
    interestAmount;
    currency;
    rate;
    balanceAfter;
    occurredOn;
    eventType = 'INTEREST_APPLIED';
    constructor(aggregateId, interestAmount, currency, rate, balanceAfter, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.interestAmount = interestAmount;
        this.currency = currency;
        this.rate = rate;
        this.balanceAfter = balanceAfter;
        this.occurredOn = occurredOn;
    }
}
exports.InterestAppliedEvent = InterestAppliedEvent;
//# sourceMappingURL=interest-applied.event.js.map