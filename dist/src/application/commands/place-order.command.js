"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceOrderCommand = void 0;
class PlaceOrderCommand {
    userId;
    accountId;
    securityId;
    type;
    quantity;
    price;
    constructor(userId, accountId, securityId, type, quantity, price) {
        this.userId = userId;
        this.accountId = accountId;
        this.securityId = securityId;
        this.type = type;
        this.quantity = quantity;
        this.price = price;
    }
}
exports.PlaceOrderCommand = PlaceOrderCommand;
//# sourceMappingURL=place-order.command.js.map