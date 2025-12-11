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
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./infrastructure/database/prisma/prisma.module");
const auth_module_1 = require("./infrastructure/auth/auth.module");
const event_store_module_1 = require("./infrastructure/event-store/event-store.module");
const user_module_1 = require("./application/user.module");
const account_module_1 = require("./application/account.module");
const investment_module_1 = require("./application/investment.module");
const loan_module_1 = require("./application/loan.module");
const chat_module_1 = require("./application/chat.module");
const notification_module_1 = require("./application/notification.module");
const admin_module_1 = require("./application/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            event_store_module_1.EventStoreModule,
            user_module_1.UserModule,
            account_module_1.AccountModule,
            investment_module_1.InvestmentModule,
            loan_module_1.LoanModule,
            chat_module_1.ChatModule,
            notification_module_1.NotificationModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map