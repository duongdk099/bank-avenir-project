import { IDomainEvent } from '../domain-event.interface.js';

export class OrderPlacedEvent implements IDomainEvent {
  public readonly eventType = 'ORDER_PLACED';

  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly accountId: string,
    public readonly securityId: string,
    public readonly type: string, // BUY or SELL
    public readonly quantity: number,
    public readonly price: number,
    public readonly status: string, // PENDING, EXECUTED, CANCELLED
    public readonly occurredOn: Date = new Date(),
  ) {}
}
