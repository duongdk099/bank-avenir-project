"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const auth_controller_js_1 = require("../interface/http/controllers/auth.controller.js");
const register_user_handler_js_1 = require("./use-cases/register-user.handler.js");
const login_handler_js_1 = require("./use-cases/login.handler.js");
const auth_module_js_1 = require("../infrastructure/auth/auth.module.js");
const event_store_module_js_1 = require("../infrastructure/event-store/event-store.module.js");
const prisma_module_js_1 = require("../infrastructure/database/prisma/prisma.module.js");
const CommandHandlers = [register_user_handler_js_1.RegisterUserHandler];
const QueryHandlers = [login_handler_js_1.LoginHandler];
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, auth_module_js_1.AuthModule, event_store_module_js_1.EventStoreModule, prisma_module_js_1.PrismaModule],
        controllers: [auth_controller_js_1.AuthController],
        providers: [...CommandHandlers, ...QueryHandlers],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map