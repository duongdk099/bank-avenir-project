import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly prisma;
    private readonly eventBus;
    server: Server;
    private readonly logger;
    private readonly userSockets;
    private readonly socketUsers;
    constructor(prisma: PrismaService, eventBus: EventBus);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handlePrivateMessage(client: Socket, payload: {
        receiverId: string;
        content: string;
    }): Promise<{
        error: string;
        success?: undefined;
        conversationId?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        conversationId: string;
        message: string;
        error?: undefined;
    }>;
    handleHelpRequest(client: Socket, payload: {
        content: string;
    }): Promise<{
        error: string;
        success?: undefined;
        message?: undefined;
        advisorAssigned?: undefined;
    } | {
        success: boolean;
        message: string;
        advisorAssigned: boolean;
        error?: undefined;
    }>;
    handleAcceptHelp(client: Socket, payload: {
        conversationId: string;
        clientId: string;
        message: string;
    }): Promise<{
        error: string;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
    handleMarkRead(client: Socket, payload: {
        conversationId: string;
    }): Promise<{
        error: string;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
