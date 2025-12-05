import { MessageEvent } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
export declare class SseController {
    private readonly prisma;
    private readonly eventBus;
    private readonly notificationStreams;
    constructor(prisma: PrismaService, eventBus: EventBus);
    streamNotifications(userId: string): Observable<MessageEvent>;
    private setupEventListeners;
    private handleDomainEvent;
    private notifyOrderExecution;
    private notifyLoanGranted;
    private notifySavingsRateChanged;
    private notifyNewMessage;
    private notifyBalanceChange;
    private pushNotification;
    onModuleDestroy(): void;
}
