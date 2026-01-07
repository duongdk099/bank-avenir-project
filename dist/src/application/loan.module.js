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
const auth_module_js_1 = require("../infrastructure/auth/auth.module.js");
const loan_controller_js_1 = require("../interface/http/controllers/loan.controller.js");
const grant_loan_handler_js_1 = require("./use-cases/grant-loan.handler.js");
const loan_request_handlers_js_1 = require("./use-cases/loan-request.handlers.js");
const loan_projector_js_1 = require("./event-handlers/loan-projector.js");
const loan_request_projector_js_1 = require("./event-handlers/loan-request-projector.js");
const CommandHandlers = [
    grant_loan_handler_js_1.GrantLoanHandler,
    loan_request_handlers_js_1.RequestLoanHandler,
    loan_request_handlers_js_1.AssignLoanRequestHandler,
    loan_request_handlers_js_1.ApproveLoanRequestHandler,
    loan_request_handlers_js_1.RejectLoanRequestHandler,
];
const EventHandlers = [
    loan_projector_js_1.LoanGrantedHandler,
    loan_projector_js_1.LoanScheduleGeneratedHandler,
    loan_request_projector_js_1.LoanRequestedHandler,
    loan_request_projector_js_1.LoanRequestAssignedHandler,
    loan_request_projector_js_1.LoanRequestApprovedHandler,
    loan_request_projector_js_1.LoanRequestRejectedHandler,
];
let LoanModule = class LoanModule {
};
exports.LoanModule = LoanModule;
exports.LoanModule = LoanModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_js_1.PrismaModule, event_store_module_js_1.EventStoreModule, auth_module_js_1.AuthModule],
        controllers: [loan_controller_js_1.LoanController],
        providers: [...CommandHandlers, ...EventHandlers],
    })
], LoanModule);
//# sourceMappingURL=loan.module.js.map