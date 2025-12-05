import { ICommandHandler } from '@nestjs/cqrs';
import { GrantLoanCommand } from '../commands/grant-loan.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
export declare class GrantLoanHandler implements ICommandHandler<GrantLoanCommand> {
    private readonly prisma;
    private readonly eventStore;
    constructor(prisma: PrismaService, eventStore: EventStore);
    execute(command: GrantLoanCommand): Promise<{
        loanId: string;
        monthlyPayment: number;
        totalAmount: number;
    }>;
}
