import { IEventHandler } from '@nestjs/cqrs';
import { AccountOpenedEvent } from '../../domain/entities/events/account-opened.event.js';
import { FundsDepositedEvent } from '../../domain/entities/events/funds-deposited.event.js';
import { FundsWithdrawnEvent } from '../../domain/entities/events/funds-withdrawn.event.js';
import { TransferSentEvent } from '../../domain/entities/events/transfer-sent.event.js';
import { TransferReceivedEvent } from '../../domain/entities/events/transfer-received.event.js';
import { InterestAppliedEvent } from '../../domain/entities/events/interest-applied.event.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
export declare class AccountOpenedHandler implements IEventHandler<AccountOpenedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: AccountOpenedEvent): Promise<void>;
}
export declare class FundsDepositedHandler implements IEventHandler<FundsDepositedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: FundsDepositedEvent): Promise<void>;
}
export declare class FundsWithdrawnHandler implements IEventHandler<FundsWithdrawnEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: FundsWithdrawnEvent): Promise<void>;
}
export declare class TransferSentHandler implements IEventHandler<TransferSentEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: TransferSentEvent): Promise<void>;
}
export declare class TransferReceivedHandler implements IEventHandler<TransferReceivedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: TransferReceivedEvent): Promise<void>;
}
export declare class InterestAppliedHandler implements IEventHandler<InterestAppliedEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: InterestAppliedEvent): Promise<void>;
}
