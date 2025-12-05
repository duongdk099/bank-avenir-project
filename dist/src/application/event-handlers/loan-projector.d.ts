import { IEventHandler } from '@nestjs/cqrs';
import { LoanGrantedEvent } from '../../domain/entities/events/loan-granted.event.js';
import { LoanScheduleGeneratedEvent } from '../../domain/entities/events/loan-schedule-generated.event.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
export declare class LoanGrantedHandler implements IEventHandler<LoanGrantedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: LoanGrantedEvent): Promise<void>;
}
export declare class LoanScheduleGeneratedHandler implements IEventHandler<LoanScheduleGeneratedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: LoanScheduleGeneratedEvent): Promise<void>;
    private calculateDueDate;
}
