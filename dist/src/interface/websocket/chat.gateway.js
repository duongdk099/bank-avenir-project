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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_service_js_1 = require("../../infrastructure/database/prisma/prisma.service.js");
const chat_projector_js_1 = require("../../application/event-handlers/chat-projector.js");
const uuid_1 = require("uuid");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    prisma;
    eventBus;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    userSockets = new Map();
    socketUsers = new Map();
    constructor(prisma, eventBus) {
        this.prisma = prisma;
        this.eventBus = eventBus;
    }
    handleConnection(client) {
        const userId = client.handshake.query.userId;
        if (!userId) {
            this.logger.warn(`Client ${client.id} connected without userId`);
            client.disconnect();
            return;
        }
        this.userSockets.set(userId, client);
        this.socketUsers.set(client.id, userId);
        this.logger.log(`User ${userId} connected (socket: ${client.id})`);
        client.join(`user:${userId}`);
        this.prisma.user.findUnique({ where: { id: userId } }).then((user) => {
            if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
                client.join('advisors');
                this.logger.log(`User ${userId} joined advisors room`);
            }
        });
    }
    handleDisconnect(client) {
        const userId = this.socketUsers.get(client.id);
        if (userId) {
            this.userSockets.delete(userId);
            this.socketUsers.delete(client.id);
            this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
        }
    }
    async handlePrivateMessage(client, payload) {
        const senderId = this.socketUsers.get(client.id);
        if (!senderId) {
            return { error: 'User not authenticated' };
        }
        const { receiverId, content } = payload;
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            include: { profile: true },
        });
        const receiver = await this.prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!sender || !receiver) {
            return { error: 'Invalid sender or receiver' };
        }
        let conversation = await this.prisma.privateConversation.findFirst({
            where: {
                OR: [
                    { user1Id: senderId, user2Id: receiverId },
                    { user1Id: receiverId, user2Id: senderId },
                ],
            },
        });
        const conversationId = conversation?.id || (0, uuid_1.v4)();
        const event = new chat_projector_js_1.PrivateMessageSentEvent(conversationId, senderId, receiverId, content);
        this.eventBus.publish(event);
        this.server.to(`user:${receiverId}`).emit('new_message', {
            conversationId,
            senderId,
            senderName: `${sender.profile?.firstName} ${sender.profile?.lastName}`,
            content,
            createdAt: new Date().toISOString(),
        });
        return {
            success: true,
            conversationId,
            message: 'Message sent',
        };
    }
    async handleHelpRequest(client, payload) {
        const clientId = this.socketUsers.get(client.id);
        if (!clientId) {
            return { error: 'User not authenticated' };
        }
        const clientUser = await this.prisma.user.findUnique({
            where: { id: clientId },
            include: { profile: true },
        });
        if (!clientUser || clientUser.role !== 'CLIENT') {
            return { error: 'Only clients can request help' };
        }
        const existingConversation = await this.prisma.privateConversation.findFirst({
            where: {
                OR: [
                    { user1Id: clientId },
                    { user2Id: clientId },
                ],
            },
            include: {
                user1: true,
                user2: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (existingConversation && existingConversation.messages.length > 0) {
            const lastMessage = existingConversation.messages[0];
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (lastMessage.createdAt > hourAgo) {
                const advisorId = existingConversation.user1Id === clientId
                    ? existingConversation.user2Id
                    : existingConversation.user1Id;
                const event = new chat_projector_js_1.PrivateMessageSentEvent(existingConversation.id, clientId, advisorId, payload.content);
                this.eventBus.publish(event);
                this.server.to(`user:${advisorId}`).emit('help_request', {
                    conversationId: existingConversation.id,
                    clientId,
                    clientName: `${clientUser.profile?.firstName} ${clientUser.profile?.lastName}`,
                    content: payload.content,
                    createdAt: new Date().toISOString(),
                });
                return {
                    success: true,
                    message: 'Request sent to your assigned advisor',
                    advisorAssigned: true,
                };
            }
        }
        const conversationId = (0, uuid_1.v4)();
        this.server.to('advisors').emit('help_request_broadcast', {
            conversationId,
            clientId,
            clientName: `${clientUser.profile?.firstName} ${clientUser.profile?.lastName}`,
            content: payload.content,
            createdAt: new Date().toISOString(),
        });
        this.logger.log(`Help request from ${clientId} broadcast to all advisors`);
        return {
            success: true,
            message: 'Request broadcast to advisors. First to respond will assist you.',
            advisorAssigned: false,
        };
    }
    async handleAcceptHelp(client, payload) {
        const advisorId = this.socketUsers.get(client.id);
        if (!advisorId) {
            return { error: 'User not authenticated' };
        }
        const advisor = await this.prisma.user.findUnique({
            where: { id: advisorId },
            include: { profile: true },
        });
        if (!advisor || (advisor.role !== 'ADMIN' && advisor.role !== 'MANAGER')) {
            return { error: 'Only advisors can accept help requests' };
        }
        const conversation = await this.prisma.privateConversation.upsert({
            where: { id: payload.conversationId },
            create: {
                id: payload.conversationId,
                user1Id: payload.clientId,
                user2Id: advisorId,
            },
            update: {},
        });
        const event = new chat_projector_js_1.PrivateMessageSentEvent(payload.conversationId, advisorId, payload.clientId, payload.message || 'Hello! How can I help you today?');
        this.eventBus.publish(event);
        this.server.to(`user:${payload.clientId}`).emit('advisor_assigned', {
            conversationId: payload.conversationId,
            advisorId,
            advisorName: `${advisor.profile?.firstName} ${advisor.profile?.lastName}`,
            message: payload.message,
        });
        this.server.to('advisors').emit('help_request_taken', {
            conversationId: payload.conversationId,
            advisorId,
        });
        return {
            success: true,
            message: 'You are now assigned to this conversation',
        };
    }
    async handleMarkRead(client, payload) {
        const userId = this.socketUsers.get(client.id);
        if (!userId) {
            return { error: 'User not authenticated' };
        }
        await this.prisma.message.updateMany({
            where: {
                conversationId: payload.conversationId,
                receiverId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
        return { success: true };
    }
    async handleTransferConversation(client, payload) {
        const currentAdvisorId = this.socketUsers.get(client.id);
        if (!currentAdvisorId) {
            return { error: 'User not authenticated' };
        }
        const currentAdvisor = await this.prisma.user.findUnique({
            where: { id: currentAdvisorId },
            include: { profile: true },
        });
        if (!currentAdvisor || (currentAdvisor.role !== 'ADMIN' && currentAdvisor.role !== 'MANAGER')) {
            return { error: 'Only advisors can transfer conversations' };
        }
        const conversation = await this.prisma.privateConversation.findUnique({
            where: { id: payload.conversationId },
            include: {
                user1: { include: { profile: true } },
                user2: { include: { profile: true } },
            },
        });
        if (!conversation) {
            return { error: 'Conversation not found' };
        }
        if (conversation.user2Id !== currentAdvisorId) {
            return { error: 'You are not the owner of this conversation' };
        }
        const newAdvisor = await this.prisma.user.findUnique({
            where: { id: payload.newAdvisorId },
            include: { profile: true },
        });
        if (!newAdvisor) {
            return { error: 'New advisor not found' };
        }
        if (newAdvisor.role !== 'ADMIN' && newAdvisor.role !== 'MANAGER') {
            return { error: 'New advisor must have ADMIN or MANAGER role' };
        }
        if (currentAdvisorId === payload.newAdvisorId) {
            return { error: 'Cannot transfer conversation to yourself' };
        }
        await this.prisma.privateConversation.update({
            where: { id: payload.conversationId },
            data: { user2Id: payload.newAdvisorId },
        });
        const clientId = conversation.user1Id;
        const reason = payload.reason || 'Your conversation has been transferred to another advisor';
        const transferMessage = `Conversation transferred from ${currentAdvisor.profile?.firstName} ${currentAdvisor.profile?.lastName} to ${newAdvisor.profile?.firstName} ${newAdvisor.profile?.lastName}. Reason: ${reason}`;
        const systemMessageEvent = new chat_projector_js_1.PrivateMessageSentEvent(payload.conversationId, 'system', clientId, transferMessage);
        this.eventBus.publish(systemMessageEvent);
        this.server.to(`user:${payload.newAdvisorId}`).emit('conversation_transferred_to_you', {
            conversationId: payload.conversationId,
            clientId,
            clientName: `${conversation.user1.profile?.firstName} ${conversation.user1.profile?.lastName}`,
            fromAdvisor: `${currentAdvisor.profile?.firstName} ${currentAdvisor.profile?.lastName}`,
            reason: payload.reason,
            timestamp: new Date().toISOString(),
        });
        this.server.to(`user:${clientId}`).emit('advisor_changed', {
            conversationId: payload.conversationId,
            newAdvisorId: payload.newAdvisorId,
            newAdvisorName: `${newAdvisor.profile?.firstName} ${newAdvisor.profile?.lastName}`,
            previousAdvisorName: `${currentAdvisor.profile?.firstName} ${currentAdvisor.profile?.lastName}`,
            reason: payload.reason,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Conversation ${payload.conversationId} transferred from ${currentAdvisorId} to ${payload.newAdvisorId}`);
        return {
            success: true,
            message: `Conversation transferred successfully to ${newAdvisor.profile?.firstName} ${newAdvisor.profile?.lastName}`,
            conversationId: payload.conversationId,
            newAdvisorId: payload.newAdvisorId,
        };
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('private_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handlePrivateMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_help'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleHelpRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('accept_help'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleAcceptHelp", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('transfer_conversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTransferConversation", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/chat',
    }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        cqrs_1.EventBus])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map