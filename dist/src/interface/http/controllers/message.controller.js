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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../../../infrastructure/database/prisma/prisma.service.js");
const jwt_auth_guard_js_1 = require("../../../infrastructure/auth/jwt-auth.guard.js");
let MessageController = class MessageController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConversations(userId) {
        const conversations = await this.prisma.privateConversation.findMany({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId },
                ],
            },
            include: {
                user1: {
                    include: { profile: true },
                },
                user2: {
                    include: { profile: true },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return conversations.map((conv) => ({
            id: conv.id,
            otherUser: conv.user1Id === userId ? {
                id: conv.user2.id,
                name: `${conv.user2.profile?.firstName} ${conv.user2.profile?.lastName}`,
                role: conv.user2.role,
            } : {
                id: conv.user1.id,
                name: `${conv.user1.profile?.firstName} ${conv.user1.profile?.lastName}`,
                role: conv.user1.role,
            },
            lastMessage: conv.messages[0] || null,
            createdAt: conv.createdAt,
        }));
    }
    async getMessages(conversationId, limit) {
        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    include: { profile: true },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit ? parseInt(limit) : undefined,
        });
        return messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderName: `${msg.sender.profile?.firstName} ${msg.sender.profile?.lastName}`,
            isRead: msg.isRead,
            createdAt: msg.createdAt,
        }));
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });
        return { count };
    }
};
exports.MessageController = MessageController;
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:conversationId'),
    __param(0, (0, common_1.Param)('conversationId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('unread'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getUnreadCount", null);
exports.MessageController = MessageController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], MessageController);
//# sourceMappingURL=message.controller.js.map