"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_module_js_1 = require("../infrastructure/database/prisma/prisma.module.js");
const event_store_module_js_1 = require("../infrastructure/event-store/event-store.module.js");
const admin_controller_js_1 = require("../interface/http/controllers/admin.controller.js");
const manage_stock_handlers_js_1 = require("./use-cases/manage-stock.handlers.js");
const account_management_handlers_js_1 = require("./use-cases/account-management.handlers.js");
const iban_service_js_1 = require("../infrastructure/services/iban.service.js");
const CommandHandlers = [
    manage_stock_handlers_js_1.CreateStockHandler,
    manage_stock_handlers_js_1.UpdateStockAvailabilityHandler,
    manage_stock_handlers_js_1.DeleteStockHandler,
    account_management_handlers_js_1.DirectorCreateAccountHandler,
    account_management_handlers_js_1.RenameAccountHandler,
    account_management_handlers_js_1.BanAccountHandler,
    account_management_handlers_js_1.CloseAccountHandler,
];
const Services = [iban_service_js_1.IbanService];
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_js_1.PrismaModule, event_store_module_js_1.EventStoreModule],
        controllers: [admin_controller_js_1.AdminController],
        providers: [...CommandHandlers, ...Services],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map