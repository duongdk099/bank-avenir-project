"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferSentEvent = void 0;
class TransferSentEvent {
    aggregateId;
    recipientAccountId;
    recipientIban;
    amount;
    currency;
    balanceAfter;
    description;
    occurredOn;
    eventType = 'TRANSFER_SENT';
    constructor(aggregateId, recipientAccountId, recipientIban, amount, currency, balanceAfter, description, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.recipientAccountId = recipientAccountId;
        this.recipientIban = recipientIban;
        this.amount = amount;
        this.currency = currency;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.occurredOn = occurredOn;
    }
}
exports.TransferSentEvent = TransferSentEvent;
//# sourceMappingURL=transfer-sent.event.js.map