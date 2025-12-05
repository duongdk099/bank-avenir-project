import { Controller, Get, Post, Param, Query, UseGuards, Body } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user notifications
   */
  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly === 'true' && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  @Post(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return { success: true };
  }

  /**
   * Mark all notifications as read
   */
  @Post('read-all')
  async markAllAsRead(@Body('userId') userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  /**
   * Get unread count
   */
  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }
}
