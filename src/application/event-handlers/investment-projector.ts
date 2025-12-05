import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { OrderPlacedEvent } from '../../domain/entities/events/order-placed.event.js';
import { OrderExecutedEvent } from '../../domain/entities/events/order-executed.event.js';
import { OrderCancelledEvent } from '../../domain/entities/events/order-cancelled.event.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { OrderStatus, TradeType } from '@prisma/client';

/**
 * Investment Projectors (Read Side)
 * Updates orders, trades, and securities tables based on domain events
 */

@Injectable()
@EventsHandler(OrderPlacedEvent)
export class OrderPlacedHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: OrderPlacedEvent) {
    await this.prisma.order.create({
      data: {
        id: event.aggregateId,
        userId: event.userId,
        accountId: event.accountId,
        securityId: event.securityId,
        type: event.type as TradeType,
        quantity: event.quantity,
        price: event.price,
        status: event.status as OrderStatus,
        remainingQuantity: event.quantity,
        createdAt: event.occurredOn,
      },
    });
  }
}

@Injectable()
@EventsHandler(OrderExecutedEvent)
export class OrderExecutedHandler implements IEventHandler<OrderExecutedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: OrderExecutedEvent) {
    // Load the order to get its details
    const order = await this.prisma.order.findUnique({
      where: { id: event.aggregateId },
    });

    if (!order) {
      throw new Error(`Order ${event.aggregateId} not found`);
    }

    // Update order status and remaining quantity
    const newRemainingQuantity = order.remainingQuantity - event.executedQuantity;
    const newStatus = newRemainingQuantity <= 0 ? 'EXECUTED' : 'PENDING';

    await this.prisma.order.update({
      where: { id: event.aggregateId },
      data: {
        remainingQuantity: newRemainingQuantity,
        status: newStatus as OrderStatus,
      },
    });

    // Create trade record
    await this.prisma.trade.create({
      data: {
        buyOrderId: order.type === 'BUY' ? event.aggregateId : event.matchedOrderId,
        sellOrderId: order.type === 'SELL' ? event.aggregateId : event.matchedOrderId,
        buyAccountId: order.type === 'BUY' ? order.accountId : (await this.prisma.order.findUnique({ where: { id: event.matchedOrderId } }))?.accountId || '',
        sellAccountId: order.type === 'SELL' ? order.accountId : (await this.prisma.order.findUnique({ where: { id: event.matchedOrderId } }))?.accountId || '',
        securityId: order.securityId,
        quantity: event.executedQuantity,
        price: event.executedPrice,
        commission: event.fee,
        executedAt: event.occurredOn,
      },
    });

    // Update security current price
    await this.prisma.security.update({
      where: { id: order.securityId },
      data: {
        currentPrice: event.executedPrice,
        lastUpdated: event.occurredOn,
      },
    });

    // Update portfolio holdings
    const buyOrder = order.type === 'BUY' ? order : await this.prisma.order.findUnique({
      where: { id: event.matchedOrderId },
    });
    const sellOrder = order.type === 'SELL' ? order : await this.prisma.order.findUnique({
      where: { id: event.matchedOrderId },
    });

    if (buyOrder && sellOrder) {
      // Update buyer's portfolio - add purchased securities
      await this.updatePortfolio(
        buyOrder.accountId,
        order.securityId,
        event.executedQuantity,
        event.executedPrice,
        'ADD',
      );

      // Note: Seller's portfolio was already decremented when SELL order was placed
      // Note: Buyer's funds were already deducted when BUY order was placed
      
      // Calculate actual cost based on execution price
      const actualBuyerCost = event.executedQuantity * event.executedPrice + event.fee;
      const reservedBuyerCost = event.executedQuantity * buyOrder.price.toNumber() + event.fee;
      
      // If execution price is lower than buy order price, refund the difference
      if (reservedBuyerCost > actualBuyerCost) {
        const refund = reservedBuyerCost - actualBuyerCost;
        await this.prisma.bankAccount.update({
          where: { id: buyOrder.accountId },
          data: {
            balance: {
              increment: refund,
            },
          },
        });
      }

      // Credit seller's account with proceeds (execution price * quantity - fee)
      const sellerProceeds = event.executedQuantity * event.executedPrice - event.fee;
      await this.prisma.bankAccount.update({
        where: { id: sellOrder.accountId },
        data: {
          balance: {
            increment: sellerProceeds,
          },
        },
      });
    }
  }

  private async updatePortfolio(
    accountId: string,
    securityId: string,
    quantity: number,
    pricePerUnit: number,
    operation: 'ADD' | 'SUBTRACT',
  ) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: {
        accountId_securityId: {
          accountId,
          securityId,
        },
      },
    });

    if (portfolio) {
      const newQuantity =
        operation === 'ADD'
          ? portfolio.quantity + quantity
          : portfolio.quantity - quantity;

      if (newQuantity <= 0) {
        // Remove portfolio entry if quantity reaches 0
        await this.prisma.portfolio.delete({
          where: {
            accountId_securityId: {
              accountId,
              securityId,
            },
          },
        });
      } else {
        await this.prisma.portfolio.update({
          where: {
            accountId_securityId: {
              accountId,
              securityId,
            },
          },
          data: { quantity: newQuantity },
        });
      }
    } else if (operation === 'ADD') {
      // Create new portfolio entry
      await this.prisma.portfolio.create({
        data: {
          accountId,
          securityId,
          quantity,
          avgPurchasePrice: pricePerUnit,
          totalCost: quantity * pricePerUnit,
        },
      });
    }
  }
}

@Injectable()
@EventsHandler(OrderCancelledEvent)
export class OrderCancelledHandler implements IEventHandler<OrderCancelledEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: OrderCancelledEvent) {
    // Get order details to determine refund/restore amount
    const order = await this.prisma.order.findUnique({
      where: { id: event.aggregateId },
    });

    if (!order) {
      throw new Error(`Order ${event.aggregateId} not found`);
    }

    // Update order status to CANCELLED
    await this.prisma.order.update({
      where: { id: event.aggregateId },
      data: {
        status: 'CANCELLED' as OrderStatus,
      },
    });

    // Refund reserved funds for BUY orders
    if (order.type === 'BUY' && order.remainingQuantity > 0) {
      const refundAmount = order.remainingQuantity * order.price.toNumber() + 1; // Include fee
      await this.prisma.bankAccount.update({
        where: { id: order.accountId },
        data: {
          balance: {
            increment: refundAmount,
          },
        },
      });
    }

    // Restore securities for SELL orders
    if (order.type === 'SELL' && order.remainingQuantity > 0) {
      const existingPortfolio = await this.prisma.portfolio.findUnique({
        where: {
          accountId_securityId: {
            accountId: order.accountId,
            securityId: order.securityId,
          },
        },
      });

      if (existingPortfolio) {
        await this.prisma.portfolio.update({
          where: {
            accountId_securityId: {
              accountId: order.accountId,
              securityId: order.securityId,
            },
          },
          data: {
            quantity: {
              increment: order.remainingQuantity,
            },
          },
        });
      } else {
        // Re-create portfolio entry if it was deleted
        await this.prisma.portfolio.create({
          data: {
            accountId: order.accountId,
            securityId: order.securityId,
            quantity: order.remainingQuantity,
            avgPurchasePrice: 0, // Unknown since we're restoring
            totalCost: 0,
          },
        });
      }
    }
  }
}
