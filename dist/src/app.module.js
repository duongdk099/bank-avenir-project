"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const app_controller_js_1 = require("./app.controller.js");
const app_service_js_1 = require("./app.service.js");
const prisma_module_js_1 = require("./infrastructure/database/prisma/prisma.module.js");
const auth_module_js_1 = require("./infrastructure/auth/auth.module.js");
const event_store_module_js_1 = require("./infrastructure/event-store/event-store.module.js");
const user_module_js_1 = require("./application/user.module.js");
const account_module_js_1 = require("./application/account.module.js");
const investment_module_js_1 = require("./application/investment.module.js");
const loan_module_js_1 = require("./application/loan.module.js");
const chat_module_js_1 = require("./application/chat.module.js");
const notification_module_js_1 = require("./application/notification.module.js");
const admin_controller_js_1 = require("./interface/http/controllers/admin.controller.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_js_1.PrismaModule,
            auth_module_js_1.AuthModule,
            event_store_module_js_1.EventStoreModule,
            user_module_js_1.UserModule,
            account_module_js_1.AccountModule,
            investment_module_js_1.InvestmentModule,
            loan_module_js_1.LoanModule,
            chat_module_js_1.ChatModule,
            notification_module_js_1.NotificationModule,
        ],
        controllers: [app_controller_js_1.AppController, admin_controller_js_1.AdminController],
        providers: [app_service_js_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map