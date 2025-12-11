"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRenamedEvent = void 0;
class AccountRenamedEvent {
    aggregateId;
    newName;
    eventType = 'ACCOUNT_RENAMED';
    occurredOn;
    constructor(aggregateId, newName) {
        this.aggregateId = aggregateId;
        this.newName = newName;
        this.occurredOn = new Date();
    }
}
exports.AccountRenamedEvent = AccountRenamedEvent;
//# sourceMappingURL=account-renamed.event.js.map