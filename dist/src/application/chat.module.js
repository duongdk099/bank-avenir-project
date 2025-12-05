"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_module_js_1 = require("../infrastructure/database/prisma/prisma.module.js");
const event_store_module_js_1 = require("../infrastructure/event-store/event-store.module.js");
const message_controller_js_1 = require("../interface/http/controllers/message.controller.js");
const chat_gateway_js_1 = require("../interface/websocket/chat.gateway.js");
const chat_projector_js_1 = require("./event-handlers/chat-projector.js");
const EventHandlers = [chat_projector_js_1.PrivateMessageSentHandler];
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_js_1.PrismaModule, event_store_module_js_1.EventStoreModule],
        controllers: [message_controller_js_1.MessageController],
        providers: [chat_gateway_js_1.ChatGateway, ...EventHandlers],
        exports: [chat_gateway_js_1.ChatGateway],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map