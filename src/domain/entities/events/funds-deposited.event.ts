import { IDomainEvent } from '../domain-event.interface.js';

export class FundsDepositedEvent implements IDomainEvent {
  public readonly eventType = 'FUNDS_DEPOSITED';

  constructor(
    public readonly aggregateId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly balanceAfter: number,
    public readonly description: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
