import { IDomainEvent } from '../domain-event.interface.js';

export class AccountClosedEvent implements IDomainEvent {
  public readonly eventType = 'ACCOUNT_CLOSED';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly reason: string,
  ) {
    this.occurredOn = new Date();
  }
}
