import { IDomainEvent } from '../domain-event.interface.js';

export class OrderExecutedEvent implements IDomainEvent {
  public readonly eventType = 'ORDER_EXECUTED';

  constructor(
    public readonly aggregateId: string,
    public readonly matchedOrderId: string,
    public readonly executedQuantity: number,
    public readonly executedPrice: number,
    public readonly fee: number, // 1€ fixed fee
    public readonly occurredOn: Date = new Date(),
  ) {}
}
