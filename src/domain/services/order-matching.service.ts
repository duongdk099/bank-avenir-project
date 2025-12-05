import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { OrderAggregate } from '../../domain/entities/order.aggregate.js';

/**
 * Order Matching Engine Domain Service
 * 
 * Implements the stock market matching logic:
 * - Matches BUY orders with SELL orders based on price
 * - Matching condition: Buy Price >= Sell Price
 * - Applies 1€ fixed fee per execution
 * - Supports partial order execution
 */
@Injectable()
export class OrderMatchingService {
  private readonly logger = new Logger(OrderMatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Attempts to match a newly placed order with existing orders in the order book
   * 
   * @param newOrder The newly placed order to match
   * @returns Number of matches found and executed
   */
  async matchOrder(newOrder: OrderAggregate): Promise<number> {
    if (!newOrder.isPending()) {
      this.logger.warn(`Order ${newOrder.getId()} is not pending, skipping matching`);
      return 0;
    }

    let matchesFound = 0;

    // Find opposite orders for the same security
    const oppositeType = newOrder.isBuyOrder() ? 'SELL' : 'BUY';
    
    // Get pending orders from the order book
    const potentialMatches = await this.prisma.order.findMany({
      where: {
        securityId: newOrder.getSecurityId(),
        type: oppositeType,
        status: 'PENDING',
      },
      orderBy: [
        // Best price first (lowest for SELL, highest for BUY)
        { price: oppositeType === 'SELL' ? 'asc' : 'desc' },
        // Then oldest first (FIFO)
        { createdAt: 'asc' },
      ],
    });

    this.logger.debug(
      `Found ${potentialMatches.length} potential matches for order ${newOrder.getId()}`,
    );

    // Try to match with each potential order
    for (const potentialMatch of potentialMatches) {
      // Check if we still have quantity to fill
      if (newOrder.getRemainingQuantity() <= 0) {
        break;
      }

      // Check if price condition is met
      const canMatch = newOrder.isBuyOrder()
        ? newOrder.getPrice() >= potentialMatch.price.toNumber()
        : newOrder.getPrice() <= potentialMatch.price.toNumber();

      if (!canMatch) {
        // No more matches possible (order book is sorted by price)
        break;
      }

      // Load the matching order aggregate from event store
      const matchOrderEvents = await this.eventStore.getEventsForAggregate(
        potentialMatch.id,
        'Order',
      );
      const matchOrder = new OrderAggregate(potentialMatch.id);
      matchOrder.loadFromHistory(matchOrderEvents);

      // Calculate execution quantity (minimum of both remaining quantities)
      const executionQuantity = Math.min(
        newOrder.getRemainingQuantity(),
        matchOrder.getRemainingQuantity(),
      );

      // Execution price is the price of the order that was in the book first (maker price)
      const executionPrice = matchOrder.getPrice();

      try {
        // Execute both orders
        newOrder.execute(
          matchOrder.getId(),
          executionQuantity,
          executionPrice,
        );
        matchOrder.execute(
          newOrder.getId(),
          executionQuantity,
          executionPrice,
        );

        // Save events for both orders
        await this.eventStore.save(newOrder, 'Order');
        await this.eventStore.save(matchOrder, 'Order');

        matchesFound++;

        this.logger.log(
          `Matched orders ${newOrder.getId()} and ${matchOrder.getId()}: ` +
          `${executionQuantity} shares at ${executionPrice}€`,
        );
      } catch (error) {
        this.logger.error(
          `Error executing match between ${newOrder.getId()} and ${matchOrder.getId()}: ${error.message}`,
          error.stack,
        );
      }
    }

    return matchesFound;
  }

  /**
   * Gets the current order book for a security
   * Useful for displaying market depth
   */
  async getOrderBook(securityId: string): Promise<{
    buyOrders: any[];
    sellOrders: any[];
  }> {
    const buyOrders = await this.prisma.order.findMany({
      where: {
        securityId,
        type: 'BUY',
        status: 'PENDING',
      },
      orderBy: [
        { price: 'desc' }, // Highest buy price first
        { createdAt: 'asc' },
      ],
      take: 10,
    });

    const sellOrders = await this.prisma.order.findMany({
      where: {
        securityId,
        type: 'SELL',
        status: 'PENDING',
      },
      orderBy: [
        { price: 'asc' }, // Lowest sell price first
        { createdAt: 'asc' },
      ],
      take: 10,
    });

    return {
      buyOrders: buyOrders.map(o => ({
        price: o.price.toNumber(),
        quantity: o.quantity,
        remainingQuantity: o.remainingQuantity,
      })),
      sellOrders: sellOrders.map(o => ({
        price: o.price.toNumber(),
        quantity: o.quantity,
        remainingQuantity: o.remainingQuantity,
      })),
    };
  }

  /**
   * Gets the best bid and ask prices for a security
   */
  async getBestPrices(securityId: string): Promise<{
    bestBid: number | null;
    bestAsk: number | null;
  }> {
    const bestBuy = await this.prisma.order.findFirst({
      where: {
        securityId,
        type: 'BUY',
        status: 'PENDING',
      },
      orderBy: { price: 'desc' },
    });

    const bestSell = await this.prisma.order.findFirst({
      where: {
        securityId,
        type: 'SELL',
        status: 'PENDING',
      },
      orderBy: { price: 'asc' },
    });

    return {
      bestBid: bestBuy ? bestBuy.price.toNumber() : null,
      bestAsk: bestSell ? bestSell.price.toNumber() : null,
    };
  }
}
