import { ICommandHandler, EventBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../commands/register-user.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { AuthService } from '../../infrastructure/auth/auth.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
export declare class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
    private readonly prisma;
    private readonly authService;
    private readonly eventStore;
    private readonly eventBus;
    constructor(prisma: PrismaService, authService: AuthService, eventStore: EventStore, eventBus: EventBus);
    execute(command: RegisterUserCommand): Promise<{
        userId: string;
    }>;
}
