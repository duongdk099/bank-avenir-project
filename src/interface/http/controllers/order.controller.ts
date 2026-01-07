import { Body, Controller, Post, Get, Param, Query, Delete, UseGuards, Request } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PlaceOrderCommand } from '../../../application/commands/place-order.command.js';
import { CancelOrderCommand } from '../../../application/commands/cancel-order.command.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { OrderMatchingService } from '../../../domain/services/order-matching.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
    private readonly matchingService: OrderMatchingService,
  ) {}

  /**
   * Place a new order (buy or sell)
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Post()
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async placeOrder(
    @Request() req,
    @Body()
    dto: {
      accountId: string;
      securityId: string;
      type: string;
      quantity: number;
      price: number;
    },
  ) {
    // Use authenticated user ID from JWT token
    const userId = req.user.sub;

    const command = new PlaceOrderCommand(
      userId,
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

  /**
   * Get order by ID
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get(':id')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
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

  /**
   * Get current user's orders
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get('my/orders')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async getMyOrders(@Request() req) {
    const userId = req.user.sub;

    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        security: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Get user orders by userId (for admins/managers)
   * Accessible to: MANAGER, ADMIN
   */
  @Get('user/:userId')
  @Roles('MANAGER', 'ADMIN')
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

  /**
   * Get order book for a security
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get('security/:securityId/book')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async getOrderBook(@Param('securityId') securityId: string) {
    const orderBook = await this.matchingService.getOrderBook(securityId);
    const bestPrices = await this.matchingService.getBestPrices(securityId);

    return {
      ...orderBook,
      ...bestPrices,
    };
  }

  /**
   * Get trades for an account
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get('account/:accountId/trades')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
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

  /**
   * Cancel an order
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Delete(':id')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async cancelOrder(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { reason?: string },
  ) {
    // Use authenticated user ID from JWT token
    const userId = req.user.sub;

    const command = new CancelOrderCommand(id, userId, dto.reason);
    const result = await this.commandBus.execute(command);

    return {
      message: 'Order cancelled successfully',
      ...result,
    };
  }
}
