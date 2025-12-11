"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountClosedEvent = void 0;
class AccountClosedEvent {
    aggregateId;
    reason;
    eventType = 'ACCOUNT_CLOSED';
    occurredOn;
    constructor(aggregateId, reason) {
        this.aggregateId = aggregateId;
        this.reason = reason;
        this.occurredOn = new Date();
    }
}
exports.AccountClosedEvent = AccountClosedEvent;
//# sourceMappingURL=account-closed.event.js.map