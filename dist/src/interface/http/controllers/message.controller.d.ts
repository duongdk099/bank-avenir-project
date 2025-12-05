import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
export declare class MessageController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getConversations(userId: string): Promise<{
        id: string;
        otherUser: {
            id: string;
            name: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        lastMessage: {
            id: string;
            createdAt: Date;
            conversationId: string;
            senderId: string;
            receiverId: string;
            content: string;
            isRead: boolean;
        };
        createdAt: Date;
    }[]>;
    getMessages(conversationId: string, limit?: string): Promise<{
        id: string;
        content: string;
        senderId: string;
        senderName: string;
        isRead: boolean;
        createdAt: Date;
    }[]>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}
