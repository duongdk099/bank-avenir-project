import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
export declare class NotificationController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getNotifications(userId: string, unreadOnly?: string): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        userId: string;
        type: string;
        isRead: boolean;
        title: string;
    }[]>;
    markAsRead(id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(userId: string): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}
