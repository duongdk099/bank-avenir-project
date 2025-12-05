import { Controller, Sse, Query, MessageEvent, UseGuards } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard.js';

/**
 * SSE Controller for real-time notifications
 * 
 * Streams domain events to connected clients:
 * - Account balance changes
 * - Order executions
 * - Loan approvals
 * - Savings rate changes
 * - New messages
 */
@Controller('sse')
export class SseController {
  private readonly notificationStreams = new Map<string, Subject<MessageEvent>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {
    // Subscribe to all domain events and broadcast to relevant users
    this.setupEventListeners();
  }

  /**
   * SSE endpoint for user notifications
   * 
   * Usage: EventSource('/api/sse/notifications?userId=xxx')
   */
  @Sse('notifications')
  streamNotifications(@Query('userId') userId: string): Observable<MessageEvent> {
    if (!userId) {
      throw new Error('userId is required');
    }

    // Create or get stream for this user
    if (!this.notificationStreams.has(userId)) {
      this.notificationStreams.set(userId, new Subject<MessageEvent>());
    }

    const stream = this.notificationStreams.get(userId)!;

    // Send initial connection message
    setTimeout(() => {
      stream.next({
        data: JSON.stringify({
          type: 'CONNECTED',
          message: 'Notification stream connected',
          timestamp: new Date().toISOString(),
        }),
      } as MessageEvent);
    }, 100);

    return stream.asObservable();
  }

  /**
   * Setup event listeners for domain events
   */
  private setupEventListeners() {
    // Listen to CQRS EventBus
    const eventBus$ = (this.eventBus as any)?.subject$ || new Subject();

    eventBus$.subscribe((event: any) => {
      this.handleDomainEvent(event);
    });
  }

  /**
   * Handle domain events and push to relevant users
   */
  private async handleDomainEvent(event: any) {
    const eventType = event.eventType || event.constructor.name;

    switch (eventType) {
      case 'ORDER_EXECUTED':
        await this.notifyOrderExecution(event);
        break;

      case 'LOAN_GRANTED':
        await this.notifyLoanGranted(event);
        break;

      case 'SAVINGS_RATE_CHANGED':
        await this.notifySavingsRateChanged(event);
        break;

      case 'PRIVATE_MESSAGE_SENT':
        await this.notifyNewMessage(event);
        break;

      case 'ACCOUNT_CREDITED':
      case 'ACCOUNT_DEBITED':
        await this.notifyBalanceChange(event);
        break;

      default:
        // Ignore other events
        break;
    }
  }

  /**
   * Notify user about order execution
   */
  private async notifyOrderExecution(event: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: event.aggregateId },
      include: { security: true },
    });

    if (order) {
      this.pushNotification(order.userId, {
        type: 'ORDER_EXECUTED',
        title: 'Order Executed',
        message: `Your ${order.type} order for ${event.executedQuantity} shares of ${order.security.symbol} has been executed at €${event.executedPrice}`,
        data: {
          orderId: order.id,
          securitySymbol: order.security.symbol,
          quantity: event.executedQuantity,
          price: event.executedPrice,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notify user about loan approval
   */
  private async notifyLoanGranted(event: any) {
    this.pushNotification(event.userId, {
      type: 'LOAN_GRANTED',
      title: 'Loan Approved',
      message: `Your loan of €${event.principal} has been approved and credited to your account`,
      data: {
        loanId: event.aggregateId,
        amount: event.principal,
        monthlyPayment: event.monthlyPayment,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify all savings account holders about rate change
   */
  private async notifySavingsRateChanged(event: any) {
    // Get all users with savings accounts
    const savingsAccounts = await this.prisma.bankAccount.findMany({
      where: { accountType: 'SAVINGS' },
      select: { userId: true },
      distinct: ['userId'],
    });

    const notification = {
      type: 'SAVINGS_RATE_CHANGED',
      title: 'Savings Rate Updated',
      message: `The savings interest rate has been updated to ${event.newRate * 100}%`,
      data: {
        oldRate: event.oldRate,
        newRate: event.newRate,
        effectiveDate: event.effectiveDate,
      },
      timestamp: new Date().toISOString(),
    };

    savingsAccounts.forEach((account) => {
      this.pushNotification(account.userId, notification);
    });
  }

  /**
   * Notify user about new message
   */
  private async notifyNewMessage(event: any) {
    const sender = await this.prisma.user.findUnique({
      where: { id: event.senderId },
      include: { profile: true },
    });

    if (sender) {
      this.pushNotification(event.receiverId, {
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${sender.profile?.firstName} ${sender.profile?.lastName}: ${event.content.substring(0, 50)}...`,
        data: {
          conversationId: event.conversationId,
          senderId: event.senderId,
          senderName: `${sender.profile?.firstName} ${sender.profile?.lastName}`,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Notify user about balance change
   */
  private async notifyBalanceChange(event: any) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: event.accountId },
    });

    if (account) {
      this.pushNotification(account.userId, {
        type: event.eventType,
        title: event.eventType === 'ACCOUNT_CREDITED' ? 'Account Credited' : 'Account Debited',
        message: `Your account has been ${event.eventType === 'ACCOUNT_CREDITED' ? 'credited' : 'debited'} €${event.amount}`,
        data: {
          accountId: event.accountId,
          amount: event.amount,
          newBalance: account.balance,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Push notification to specific user
   */
  private pushNotification(userId: string, notification: any) {
    const stream = this.notificationStreams.get(userId);
    
    if (stream) {
      stream.next({
        data: JSON.stringify(notification),
      } as MessageEvent);

      // Also persist to database
      this.prisma.notification.create({
        data: {
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: false,
        },
      }).catch((err) => {
        console.error('Failed to persist notification:', err);
      });
    }
  }

  /**
   * Cleanup stream when user disconnects
   */
  onModuleDestroy() {
    this.notificationStreams.forEach((stream) => stream.complete());
    this.notificationStreams.clear();
  }
}
