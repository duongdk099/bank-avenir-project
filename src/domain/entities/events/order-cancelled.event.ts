import { IDomainEvent } from '../domain-event.interface.js';

export class OrderCancelledEvent implements IDomainEvent {
  public readonly eventType = 'ORDER_CANCELLED';

  constructor(
    public readonly aggregateId: string,
    public readonly reason: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
