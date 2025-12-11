import { ICommandHandler } from '@nestjs/cqrs';
import { DirectorCreateAccountCommand, RenameAccountCommand, CloseAccountCommand, BanAccountCommand } from '../commands/account-management.commands.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { IbanService } from '../../infrastructure/services/iban.service.js';
export declare class DirectorCreateAccountHandler implements ICommandHandler<DirectorCreateAccountCommand> {
    private readonly prisma;
    private readonly eventStore;
    private readonly ibanService;
    constructor(prisma: PrismaService, eventStore: EventStore, ibanService: IbanService);
    execute(command: DirectorCreateAccountCommand): Promise<{
        accountId: string;
        iban: string;
    }>;
}
export declare class RenameAccountHandler implements ICommandHandler<RenameAccountCommand> {
    private readonly prisma;
    private readonly eventStore;
    constructor(prisma: PrismaService, eventStore: EventStore);
    execute(command: RenameAccountCommand): Promise<{
        success: boolean;
    }>;
}
export declare class CloseAccountHandler implements ICommandHandler<CloseAccountCommand> {
    private readonly prisma;
    private readonly eventStore;
    constructor(prisma: PrismaService, eventStore: EventStore);
    execute(command: CloseAccountCommand): Promise<{
        success: boolean;
    }>;
}
export declare class BanAccountHandler implements ICommandHandler<BanAccountCommand> {
    private readonly prisma;
    private readonly eventStore;
    constructor(prisma: PrismaService, eventStore: EventStore);
    execute(command: BanAccountCommand): Promise<{
        success: boolean;
    }>;
}
