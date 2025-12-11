import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { 
  CreateStockCommand, 
  UpdateStockAvailabilityCommand, 
  DeleteStockCommand 
} from '../commands/manage-stock.commands.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';

/**
 * Create Stock Handler
 */
@CommandHandler(CreateStockCommand)
export class CreateStockHandler implements ICommandHandler<CreateStockCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateStockCommand): Promise<{ stockId: string }> {
    // Check if symbol already exists
    const existing = await this.prisma.security.findFirst({
      where: { symbol: command.symbol.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Stock with symbol ${command.symbol} already exists`);
    }

    const stock = await this.prisma.security.create({
      data: {
        symbol: command.symbol.toUpperCase(),
        name: command.name,
        type: command.type,
        exchange: command.exchange,
        currentPrice: command.currentPrice,
        currency: command.currency,
        isAvailable: true,
        lastUpdated: new Date(),
      },
    });

    return { stockId: stock.id };
  }
}

/**
 * Update Stock Availability Handler
 */
@CommandHandler(UpdateStockAvailabilityCommand)
export class UpdateStockAvailabilityHandler implements ICommandHandler<UpdateStockAvailabilityCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateStockAvailabilityCommand): Promise<{ success: boolean }> {
    const stock = await this.prisma.security.findFirst({
      where: { symbol: command.symbol.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with symbol ${command.symbol} not found`);
    }

    await this.prisma.security.update({
      where: { id: stock.id },
      data: { 
        isAvailable: command.isAvailable,
        lastUpdated: new Date(),
      },
    });

    return { success: true };
  }
}

/**
 * Delete Stock Handler
 */
@CommandHandler(DeleteStockCommand)
export class DeleteStockHandler implements ICommandHandler<DeleteStockCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteStockCommand): Promise<{ success: boolean }> {
    const stock = await this.prisma.security.findFirst({
      where: { symbol: command.symbol.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with symbol ${command.symbol} not found`);
    }

    // Check if stock is used in any orders or portfolio
    const ordersCount = await this.prisma.order.count({
      where: { securityId: stock.id },
    });

    const portfolioCount = await this.prisma.portfolio.count({
      where: { securityId: stock.id },
    });

    if (ordersCount > 0 || portfolioCount > 0) {
      throw new ConflictException(
        `Cannot delete stock ${command.symbol}. It is referenced in existing orders or portfolios. Consider disabling it instead.`
      );
    }

    await this.prisma.security.delete({
      where: { id: stock.id },
    });

    return { success: true };
  }
}
