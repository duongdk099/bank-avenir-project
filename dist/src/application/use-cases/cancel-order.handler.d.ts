import { ICommandHandler } from '@nestjs/cqrs';
import { CancelOrderCommand } from '../commands/cancel-order.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventBus } from '@nestjs/cqrs';
export declare class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
    private readonly prisma;
    private readonly eventBus;
    constructor(prisma: PrismaService, eventBus: EventBus);
    execute(command: CancelOrderCommand): Promise<{
        success: boolean;
    }>;
}
