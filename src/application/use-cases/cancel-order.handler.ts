import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CancelOrderCommand } from '../commands/cancel-order.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { OrderCancelledEvent } from '../../domain/entities/events/order-cancelled.event.js';
import { EventBus } from '@nestjs/cqrs';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelOrderCommand): Promise<{ success: boolean }> {
    // Verify the order exists and belongs to the user
    const order = await this.prisma.order.findUnique({
      where: { id: command.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== command.userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel order with status: ${order.status}`,
      );
    }

    // Create and publish the cancellation event
    const event = new OrderCancelledEvent(command.orderId, command.reason);
    this.eventBus.publish(event);

    return { success: true };
  }
}
