"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCancelledEvent = void 0;
class OrderCancelledEvent {
    aggregateId;
    reason;
    occurredOn;
    eventType = 'ORDER_CANCELLED';
    constructor(aggregateId, reason, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.reason = reason;
        this.occurredOn = occurredOn;
    }
}
exports.OrderCancelledEvent = OrderCancelledEvent;
//# sourceMappingURL=order-cancelled.event.js.map