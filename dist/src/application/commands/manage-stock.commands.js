"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteStockCommand = exports.UpdateStockAvailabilityCommand = exports.CreateStockCommand = void 0;
class CreateStockCommand {
    symbol;
    name;
    type;
    exchange;
    currentPrice;
    currency;
    constructor(symbol, name, type, exchange, currentPrice, currency) {
        this.symbol = symbol;
        this.name = name;
        this.type = type;
        this.exchange = exchange;
        this.currentPrice = currentPrice;
        this.currency = currency;
    }
}
exports.CreateStockCommand = CreateStockCommand;
class UpdateStockAvailabilityCommand {
    symbol;
    isAvailable;
    constructor(symbol, isAvailable) {
        this.symbol = symbol;
        this.isAvailable = isAvailable;
    }
}
exports.UpdateStockAvailabilityCommand = UpdateStockAvailabilityCommand;
class DeleteStockCommand {
    symbol;
    constructor(symbol) {
        this.symbol = symbol;
    }
}
exports.DeleteStockCommand = DeleteStockCommand;
//# sourceMappingURL=manage-stock.commands.js.map