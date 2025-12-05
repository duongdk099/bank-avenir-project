"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateMessageSentHandler = exports.PrivateMessageSentEvent = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
class PrivateMessageSentEvent {
    conversationId;
    senderId;
    receiverId;
    content;
    occurredOn;
    constructor(conversationId, senderId, receiverId, content, occurredOn = new Date()) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.occurredOn = occurredOn;
    }
    get eventType() {
        return 'PRIVATE_MESSAGE_SENT';
    }
}
exports.PrivateMessageSentEvent = PrivateMessageSentEvent;
let PrivateMessageSentHandler = class PrivateMessageSentHandler {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handle(event) {
        const conversation = await this.prisma.privateConversation.findUnique({
            where: { id: event.conversationId },
        });
        if (!conversation) {
            await this.prisma.privateConversation.create({
                data: {
                    id: event.conversationId,
                    user1Id: event.senderId,
                    user2Id: event.receiverId,
                    createdAt: event.occurredOn,
                },
            });
        }
        await this.prisma.message.create({
            data: {
                conversationId: event.conversationId,
                senderId: event.senderId,
                receiverId: event.receiverId,
                content: event.content,
                isRead: false,
                createdAt: event.occurredOn,
            },
        });
    }
};
exports.PrivateMessageSentHandler = PrivateMessageSentHandler;
exports.PrivateMessageSentHandler = PrivateMessageSentHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.EventsHandler)(PrivateMessageSentEvent),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], PrivateMessageSentHandler);
//# sourceMappingURL=chat-projector.js.map