import { Body, Controller, Post, Get, Param, Query, Delete } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PlaceOrderCommand } from '../../../application/commands/place-order.command.js';
import { CancelOrderCommand } from '../../../application/commands/cancel-order.command.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { OrderMatchingService } from '../../../domain/services/order-matching.service.js';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
    private readonly matchingService: OrderMatchingService,
  ) {}

  @Post()
  async placeOrder(
    @Body()
    dto: {
      userId: string;
      accountId: string;
      securityId: string;
      type: string;
      quantity: number;
      price: number;
    },
  ) {
    const command = new PlaceOrderCommand(
      dto.userId,
      dto.accountId,
      dto.securityId,
      dto.type,
      dto.quantity,
      dto.price,
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'Order placed successfully',
      ...result,
    };
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        security: true,
        account: true,
      },
    });

    return order;
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        security: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  @Get('security/:securityId/book')
  async getOrderBook(@Param('securityId') securityId: string) {
    const orderBook = await this.matchingService.getOrderBook(securityId);
    const bestPrices = await this.matchingService.getBestPrices(securityId);

    return {
      ...orderBook,
      ...bestPrices,
    };
  }

  @Get('account/:accountId/trades')
  async getAccountTrades(@Param('accountId') accountId: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        OR: [
          { buyAccountId: accountId },
          { sellAccountId: accountId },
        ],
      },
      include: {
        security: true,
      },
      orderBy: { executedAt: 'desc' },
    });

    return trades;
  }

  @Delete(':id')
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: { userId: string; reason?: string },
  ) {
    const command = new CancelOrderCommand(id, dto.userId, dto.reason);
    const result = await this.commandBus.execute(command);
    
    return {
      message: 'Order cancelled successfully',
      ...result,
    };
  }
}
