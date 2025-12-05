import { AggregateRoot } from './aggregate-root.js';
import { IDomainEvent } from './domain-event.interface.js';
import { OrderPlacedEvent } from './events/order-placed.event.js';
import { OrderExecutedEvent } from './events/order-executed.event.js';
import { OrderCancelledEvent } from './events/order-cancelled.event.js';

export class OrderAggregate extends AggregateRoot {
  private userId: string;
  private accountId: string;
  private securityId: string;
  private type: string; // BUY or SELL
  private quantity: number;
  private price: number;
  private status: string; // PENDING, EXECUTED, CANCELLED
  private remainingQuantity: number;

  constructor(id: string) {
    super(id);
  }

  /**
   * Factory method to place a new order
   */
  static place(
    id: string,
    userId: string,
    accountId: string,
    securityId: string,
    type: string,
    quantity: number,
    price: number,
  ): OrderAggregate {
    if (type !== 'BUY' && type !== 'SELL') {
      throw new Error('Order type must be BUY or SELL');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (price <= 0) {
      throw new Error('Price must be positive');
    }

    const order = new OrderAggregate(id);
    const event = new OrderPlacedEvent(
      id,
      userId,
      accountId,
      securityId,
      type,
      quantity,
      price,
      'PENDING',
    );
    order.apply(event);
    return order;
  }

  /**
   * Execute the order (full or partial)
   */
  execute(matchedOrderId: string, executedQuantity: number, executedPrice: number): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending orders can be executed');
    }

    if (executedQuantity > this.remainingQuantity) {
      throw new Error('Executed quantity exceeds remaining quantity');
    }

    // Fixed fee of 1€ per execution
    const fee = 1.0;

    const event = new OrderExecutedEvent(
      this.id,
      matchedOrderId,
      executedQuantity,
      executedPrice,
      fee,
    );
    this.apply(event);
  }

  /**
   * Cancel the order
   */
  cancel(reason: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending orders can be cancelled');
    }

    const event = new OrderCancelledEvent(this.id, reason);
    this.apply(event);
  }

  // Event handlers
  protected applyEvent(event: IDomainEvent): void {
    switch (event.eventType) {
      case 'ORDER_PLACED':
        this.onOrderPlaced(event as OrderPlacedEvent);
        break;
      case 'ORDER_EXECUTED':
        this.onOrderExecuted(event as OrderExecutedEvent);
        break;
      case 'ORDER_CANCELLED':
        this.onOrderCancelled(event as OrderCancelledEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }

  private onOrderPlaced(event: OrderPlacedEvent): void {
    this.userId = event.userId;
    this.accountId = event.accountId;
    this.securityId = event.securityId;
    this.type = event.type;
    this.quantity = event.quantity;
    this.price = event.price;
    this.status = event.status;
    this.remainingQuantity = event.quantity;
  }

  private onOrderExecuted(event: OrderExecutedEvent): void {
    this.remainingQuantity -= event.executedQuantity;
    
    if (this.remainingQuantity <= 0) {
      this.status = 'EXECUTED';
    }
  }

  private onOrderCancelled(event: OrderCancelledEvent): void {
    this.status = 'CANCELLED';
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getAccountId(): string {
    return this.accountId;
  }

  getSecurityId(): string {
    return this.securityId;
  }

  getType(): string {
    return this.type;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getPrice(): number {
    return this.price;
  }

  getStatus(): string {
    return this.status;
  }

  getRemainingQuantity(): number {
    return this.remainingQuantity;
  }

  isBuyOrder(): boolean {
    return this.type === 'BUY';
  }

  isSellOrder(): boolean {
    return this.type === 'SELL';
  }

  isPending(): boolean {
    return this.status === 'PENDING';
  }
}
