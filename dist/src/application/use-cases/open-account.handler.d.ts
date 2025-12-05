import { ICommandHandler } from '@nestjs/cqrs';
import { OpenAccountCommand } from '../commands/open-account.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { IbanService } from '../../infrastructure/services/iban.service.js';
export declare class OpenAccountHandler implements ICommandHandler<OpenAccountCommand> {
    private readonly prisma;
    private readonly eventStore;
    private readonly ibanService;
    constructor(prisma: PrismaService, eventStore: EventStore, ibanService: IbanService);
    execute(command: OpenAccountCommand): Promise<{
        accountId: string;
        iban: string;
    }>;
}
