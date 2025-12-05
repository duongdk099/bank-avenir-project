"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderAggregate = void 0;
const aggregate_root_js_1 = require("./aggregate-root.js");
const order_placed_event_js_1 = require("./events/order-placed.event.js");
const order_executed_event_js_1 = require("./events/order-executed.event.js");
const order_cancelled_event_js_1 = require("./events/order-cancelled.event.js");
class OrderAggregate extends aggregate_root_js_1.AggregateRoot {
    userId;
    accountId;
    securityId;
    type;
    quantity;
    price;
    status;
    remainingQuantity;
    constructor(id) {
        super(id);
    }
    static place(id, userId, accountId, securityId, type, quantity, price) {
        if (type !== 'BUY' && type !== 'SELL') {
            throw new Error('Order type must be BUY or SELL');
        }
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
        if (price <= 0) {
            throw new Error('Price must be positive');
        }
        const order = new OrderAggregate(id);
        const event = new order_placed_event_js_1.OrderPlacedEvent(id, userId, accountId, securityId, type, quantity, price, 'PENDING');
        order.apply(event);
        return order;
    }
    execute(matchedOrderId, executedQuantity, executedPrice) {
        if (this.status !== 'PENDING') {
            throw new Error('Only pending orders can be executed');
        }
        if (executedQuantity > this.remainingQuantity) {
            throw new Error('Executed quantity exceeds remaining quantity');
        }
        const fee = 1.0;
        const event = new order_executed_event_js_1.OrderExecutedEvent(this.id, matchedOrderId, executedQuantity, executedPrice, fee);
        this.apply(event);
    }
    cancel(reason) {
        if (this.status !== 'PENDING') {
            throw new Error('Only pending orders can be cancelled');
        }
        const event = new order_cancelled_event_js_1.OrderCancelledEvent(this.id, reason);
        this.apply(event);
    }
    applyEvent(event) {
        switch (event.eventType) {
            case 'ORDER_PLACED':
                this.onOrderPlaced(event);
                break;
            case 'ORDER_EXECUTED':
                this.onOrderExecuted(event);
                break;
            case 'ORDER_CANCELLED':
                this.onOrderCancelled(event);
                break;
            default:
                throw new Error(`Unknown event type: ${event.eventType}`);
        }
    }
    onOrderPlaced(event) {
        this.userId = event.userId;
        this.accountId = event.accountId;
        this.securityId = event.securityId;
        this.type = event.type;
        this.quantity = event.quantity;
        this.price = event.price;
        this.status = event.status;
        this.remainingQuantity = event.quantity;
    }
    onOrderExecuted(event) {
        this.remainingQuantity -= event.executedQuantity;
        if (this.remainingQuantity <= 0) {
            this.status = 'EXECUTED';
        }
    }
    onOrderCancelled(event) {
        this.status = 'CANCELLED';
    }
    getUserId() {
        return this.userId;
    }
    getAccountId() {
        return this.accountId;
    }
    getSecurityId() {
        return this.securityId;
    }
    getType() {
        return this.type;
    }
    getQuantity() {
        return this.quantity;
    }
    getPrice() {
        return this.price;
    }
    getStatus() {
        return this.status;
    }
    getRemainingQuantity() {
        return this.remainingQuantity;
    }
    isBuyOrder() {
        return this.type === 'BUY';
    }
    isSellOrder() {
        return this.type === 'SELL';
    }
    isPending() {
        return this.status === 'PENDING';
    }
}
exports.OrderAggregate = OrderAggregate;
//# sourceMappingURL=order.aggregate.js.map