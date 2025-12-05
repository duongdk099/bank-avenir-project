"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_js_1 = require("../infrastructure/database/prisma/prisma.module.js");
const event_store_module_js_1 = require("../infrastructure/event-store/event-store.module.js");
const account_controller_js_1 = require("../interface/http/controllers/account.controller.js");
const iban_service_js_1 = require("../infrastructure/services/iban.service.js");
const interest_calculation_service_js_1 = require("./services/interest-calculation.service.js");
const open_account_handler_js_1 = require("./use-cases/open-account.handler.js");
const account_projector_js_1 = require("./event-handlers/account-projector.js");
const CommandHandlers = [open_account_handler_js_1.OpenAccountHandler];
const EventHandlers = [
    account_projector_js_1.AccountOpenedHandler,
    account_projector_js_1.FundsDepositedHandler,
    account_projector_js_1.FundsWithdrawnHandler,
    account_projector_js_1.TransferSentHandler,
    account_projector_js_1.TransferReceivedHandler,
    account_projector_js_1.InterestAppliedHandler,
];
const Services = [iban_service_js_1.IbanService, interest_calculation_service_js_1.InterestCalculationService];
let AccountModule = class AccountModule {
};
exports.AccountModule = AccountModule;
exports.AccountModule = AccountModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_js_1.PrismaModule, event_store_module_js_1.EventStoreModule, schedule_1.ScheduleModule.forRoot()],
        controllers: [account_controller_js_1.AccountController],
        providers: [...CommandHandlers, ...EventHandlers, ...Services],
        exports: [iban_service_js_1.IbanService, interest_calculation_service_js_1.InterestCalculationService],
    })
], AccountModule);
//# sourceMappingURL=account.module.js.map