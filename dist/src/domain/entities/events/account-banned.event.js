"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountBannedEvent = void 0;
class AccountBannedEvent {
    aggregateId;
    reason;
    eventType = 'ACCOUNT_BANNED';
    occurredOn;
    constructor(aggregateId, reason) {
        this.aggregateId = aggregateId;
        this.reason = reason;
        this.occurredOn = new Date();
    }
}
exports.AccountBannedEvent = AccountBannedEvent;
//# sourceMappingURL=account-banned.event.js.map