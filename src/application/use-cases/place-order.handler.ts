import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlaceOrderCommand } from '../commands/place-order.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { OrderMatchingService } from '../../domain/services/order-matching.service.js';
import { OrderAggregate } from '../../domain/entities/order.aggregate.js';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler implements ICommandHandler<PlaceOrderCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
    private readonly matchingService: OrderMatchingService,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<{ orderId: string; matchesFound: number }> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate account exists and belongs to user
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: command.accountId,
        userId: command.userId,
        accountType: 'INVESTMENT',
        status: 'ACTIVE',
      },
    });

    if (!account) {
      throw new NotFoundException(
        'Active investment account not found for this user',
      );
    }

    // Validate security exists
    const security = await this.prisma.security.findUnique({
      where: { id: command.securityId },
    });

    if (!security) {
      throw new NotFoundException('Security not found');
    }

    // Validate order type
    if (command.type !== 'BUY' && command.type !== 'SELL') {
      throw new BadRequestException('Order type must be BUY or SELL');
    }

    // Validate quantity and price
    if (command.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    if (command.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    // For BUY orders, check if user has sufficient funds and reserve them
    if (command.type === 'BUY') {
      const totalCost = command.quantity * command.price + 1; // Include 1€ fee
      const availableBalance = Number(account.balance);
      
      console.log(`[PlaceOrderHandler] BUY Order Validation:`);
      console.log(`  Required: €${totalCost.toFixed(2)}`);
      console.log(`  Available: €${availableBalance.toFixed(2)}`);
      console.log(`  Sufficient: ${availableBalance >= totalCost}`);
      
      if (availableBalance < totalCost) {
        throw new BadRequestException(
          `Insufficient funds. Required: €${totalCost.toFixed(2)}, Available: €${availableBalance.toFixed(2)}`
        );
      }

      // Reserve funds immediately by deducting from balance
      await this.prisma.bankAccount.update({
        where: { id: command.accountId },
        data: {
          balance: {
            decrement: totalCost,
          },
        },
      });
      
      console.log(`[PlaceOrderHandler] Reserved €${totalCost.toFixed(2)} from account`);
    }

    // For SELL orders, check if user has sufficient securities and reserve them
    if (command.type === 'SELL') {
      const portfolio = await this.prisma.portfolio.findUnique({
        where: {
          accountId_securityId: {
            accountId: command.accountId,
            securityId: command.securityId,
          },
        },
      });

      if (!portfolio || portfolio.quantity < command.quantity) {
        throw new BadRequestException(
          `Insufficient securities. Required: ${command.quantity}, Available: ${portfolio?.quantity || 0}`
        );
      }

      // Reserve securities immediately by deducting from portfolio
      const newQuantity = portfolio.quantity - command.quantity;
      if (newQuantity === 0) {
        await this.prisma.portfolio.delete({
          where: {
            accountId_securityId: {
              accountId: command.accountId,
              securityId: command.securityId,
            },
          },
        });
      } else {
        await this.prisma.portfolio.update({
          where: {
            accountId_securityId: {
              accountId: command.accountId,
              securityId: command.securityId,
            },
          },
          data: {
            quantity: newQuantity,
          },
        });
      }
    }

    // Create order aggregate
    const orderId = uuidv4();
    const order = OrderAggregate.place(
      orderId,
      command.userId,
      command.accountId,
      command.securityId,
      command.type,
      command.quantity,
      command.price,
    );

    // Save events to event store
    await this.eventStore.save(order, 'Order');

    // Try to match the order with existing orders
    const matchesFound = await this.matchingService.matchOrder(order);

    return {
      orderId,
      matchesFound,
    };
  }
}
