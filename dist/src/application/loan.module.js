"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_module_js_1 = require("../infrastructure/database/prisma/prisma.module.js");
const event_store_module_js_1 = require("../infrastructure/event-store/event-store.module.js");
const loan_controller_js_1 = require("../interface/http/controllers/loan.controller.js");
const grant_loan_handler_js_1 = require("./use-cases/grant-loan.handler.js");
const loan_projector_js_1 = require("./event-handlers/loan-projector.js");
const CommandHandlers = [grant_loan_handler_js_1.GrantLoanHandler];
const EventHandlers = [loan_projector_js_1.LoanGrantedHandler, loan_projector_js_1.LoanScheduleGeneratedHandler];
let LoanModule = class LoanModule {
};
exports.LoanModule = LoanModule;
exports.LoanModule = LoanModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_js_1.PrismaModule, event_store_module_js_1.EventStoreModule],
        controllers: [loan_controller_js_1.LoanController],
        providers: [...CommandHandlers, ...EventHandlers],
    })
], LoanModule);
//# sourceMappingURL=loan.module.js.map