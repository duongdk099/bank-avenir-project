"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferReceivedEvent = void 0;
class TransferReceivedEvent {
    aggregateId;
    senderAccountId;
    senderIban;
    amount;
    currency;
    balanceAfter;
    description;
    occurredOn;
    eventType = 'TRANSFER_RECEIVED';
    constructor(aggregateId, senderAccountId, senderIban, amount, currency, balanceAfter, description, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.senderAccountId = senderAccountId;
        this.senderIban = senderIban;
        this.amount = amount;
        this.currency = currency;
        this.balanceAfter = balanceAfter;
        this.description = description;
        this.occurredOn = occurredOn;
    }
}
exports.TransferReceivedEvent = TransferReceivedEvent;
//# sourceMappingURL=transfer-received.event.js.map