"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderExecutedEvent = void 0;
class OrderExecutedEvent {
    aggregateId;
    matchedOrderId;
    executedQuantity;
    executedPrice;
    fee;
    occurredOn;
    eventType = 'ORDER_EXECUTED';
    constructor(aggregateId, matchedOrderId, executedQuantity, executedPrice, fee, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.matchedOrderId = matchedOrderId;
        this.executedQuantity = executedQuantity;
        this.executedPrice = executedPrice;
        this.fee = fee;
        this.occurredOn = occurredOn;
    }
}
exports.OrderExecutedEvent = OrderExecutedEvent;
//# sourceMappingURL=order-executed.event.js.map