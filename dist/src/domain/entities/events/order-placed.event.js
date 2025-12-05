"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPlacedEvent = void 0;
class OrderPlacedEvent {
    aggregateId;
    userId;
    accountId;
    securityId;
    type;
    quantity;
    price;
    status;
    occurredOn;
    eventType = 'ORDER_PLACED';
    constructor(aggregateId, userId, accountId, securityId, type, quantity, price, status, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.userId = userId;
        this.accountId = accountId;
        this.securityId = securityId;
        this.type = type;
        this.quantity = quantity;
        this.price = price;
        this.status = status;
        this.occurredOn = occurredOn;
    }
}
exports.OrderPlacedEvent = OrderPlacedEvent;
//# sourceMappingURL=order-placed.event.js.map