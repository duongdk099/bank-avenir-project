"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsRateChangedEvent = void 0;
class SavingsRateChangedEvent {
    accountType;
    oldRate;
    newRate;
    minBalance;
    effectiveDate;
    eventType = 'SAVINGS_RATE_CHANGED';
    aggregateId = 'SYSTEM';
    occurredOn;
    constructor(accountType, oldRate, newRate, minBalance, effectiveDate) {
        this.accountType = accountType;
        this.oldRate = oldRate;
        this.newRate = newRate;
        this.minBalance = minBalance;
        this.effectiveDate = effectiveDate;
        this.occurredOn = new Date();
    }
}
exports.SavingsRateChangedEvent = SavingsRateChangedEvent;
//# sourceMappingURL=savings-rate-changed.event.js.map