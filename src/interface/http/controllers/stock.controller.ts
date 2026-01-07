import { Controller, Get, UseGuards, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { OrderMatchingService } from '../../../domain/services/order-matching.service.js';

/**
 * Stock Controller
 * Accessible to all authenticated users (CLIENT, MANAGER, ADMIN)
 * Allows viewing available stocks and market data
 */
@Controller('stocks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: OrderMatchingService,
  ) {}

  /**
   * Get all available stocks
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get()
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async getAllStocks(
    @Query('available') available?: string,
  ) {
    const where = available === 'true' ? { isAvailable: true } : {};

    const stocks = await this.prisma.security.findMany({
      where,
      orderBy: { symbol: 'asc' },
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        exchange: true,
        currentPrice: true,
        currency: true,
        isAvailable: true,
        lastUpdated: true,
      },
    });

    return {
      count: stocks.length,
      stocks,
    };
  }

  /**
   * Get stock details by symbol
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get(':symbol')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async getStockBySymbol(@Param('symbol') symbol: string) {
    const stock = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        exchange: true,
        currentPrice: true,
        currency: true,
        isAvailable: true,
        lastUpdated: true,
      },
    });

    if (!stock) {
      return { message: 'Stock not found' };
    }

    return stock;
  }

  /**
   * Get order book for a specific stock
   * Shows buy and sell orders with best prices
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get(':symbol/orderbook')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async getOrderBook(@Param('symbol') symbol: string) {
    // Find security by symbol
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!security) {
      return { message: 'Stock not found' };
    }

    const orderBook = await this.matchingService.getOrderBook(security.id);
    const bestPrices = await this.matchingService.getBestPrices(security.id);

    return {
      symbol: security.symbol,
      name: security.name,
      currentPrice: security.currentPrice,
      ...orderBook,
      ...bestPrices,
    };
  }

  /**
   * Get market statistics for a stock
   * Accessible to: CLIENT, MANAGER, ADMIN
   */
  @Get(':symbol/stats')
  @Roles('CLIENT', 'MANAGER', 'ADMIN')
  async getStockStats(@Param('symbol') symbol: string) {
    // Find security by symbol
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!security) {
      return { message: 'Stock not found' };
    }

    // Get trade statistics
    const trades = await this.prisma.trade.findMany({
      where: { securityId: security.id },
      orderBy: { executedAt: 'desc' },
      take: 100, // Last 100 trades
    });

    // Calculate statistics
    const totalVolume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
    const avgPrice = trades.length > 0
      ? trades.reduce((sum, trade) => sum + Number(trade.price), 0) / trades.length
      : 0;

    const recentTrades = trades.slice(0, 10).map(trade => ({
      price: trade.price,
      quantity: trade.quantity,
      executedAt: trade.executedAt,
    }));

    return {
      symbol: security.symbol,
      name: security.name,
      currentPrice: security.currentPrice,
      statistics: {
        totalVolume,
        averagePrice: avgPrice,
        tradesCount: trades.length,
      },
      recentTrades,
    };
  }
}
