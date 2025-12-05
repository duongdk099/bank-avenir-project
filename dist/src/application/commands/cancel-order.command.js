"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelOrderCommand = void 0;
class CancelOrderCommand {
    orderId;
    userId;
    reason;
    constructor(orderId, userId, reason = 'User cancelled') {
        this.orderId = orderId;
        this.userId = userId;
        this.reason = reason;
    }
}
exports.CancelOrderCommand = CancelOrderCommand;
//# sourceMappingURL=cancel-order.command.js.map