"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_module_js_1 = require("../infrastructure/database/prisma/prisma.module.js");
const event_store_module_js_1 = require("../infrastructure/event-store/event-store.module.js");
const order_controller_js_1 = require("../interface/http/controllers/order.controller.js");
const order_matching_service_js_1 = require("../domain/services/order-matching.service.js");
const place_order_handler_js_1 = require("./use-cases/place-order.handler.js");
const cancel_order_handler_js_1 = require("./use-cases/cancel-order.handler.js");
const investment_projector_js_1 = require("./event-handlers/investment-projector.js");
const CommandHandlers = [place_order_handler_js_1.PlaceOrderHandler, cancel_order_handler_js_1.CancelOrderHandler];
const EventHandlers = [
    investment_projector_js_1.OrderPlacedHandler,
    investment_projector_js_1.OrderExecutedHandler,
    investment_projector_js_1.OrderCancelledHandler,
];
const Services = [order_matching_service_js_1.OrderMatchingService];
let InvestmentModule = class InvestmentModule {
};
exports.InvestmentModule = InvestmentModule;
exports.InvestmentModule = InvestmentModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_js_1.PrismaModule, event_store_module_js_1.EventStoreModule],
        controllers: [order_controller_js_1.OrderController],
        providers: [...CommandHandlers, ...EventHandlers, ...Services],
        exports: [order_matching_service_js_1.OrderMatchingService],
    })
], InvestmentModule);
//# sourceMappingURL=investment.module.js.map