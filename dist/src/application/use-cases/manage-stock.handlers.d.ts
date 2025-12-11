import { ICommandHandler } from '@nestjs/cqrs';
import { CreateStockCommand, UpdateStockAvailabilityCommand, DeleteStockCommand } from '../commands/manage-stock.commands.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
export declare class CreateStockHandler implements ICommandHandler<CreateStockCommand> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute(command: CreateStockCommand): Promise<{
        stockId: string;
    }>;
}
export declare class UpdateStockAvailabilityHandler implements ICommandHandler<UpdateStockAvailabilityCommand> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute(command: UpdateStockAvailabilityCommand): Promise<{
        success: boolean;
    }>;
}
export declare class DeleteStockHandler implements ICommandHandler<DeleteStockCommand> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    execute(command: DeleteStockCommand): Promise<{
        success: boolean;
    }>;
}
