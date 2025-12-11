import { IDomainEvent } from '../domain-event.interface.js';

export class AccountBannedEvent implements IDomainEvent {
  public readonly eventType = 'ACCOUNT_BANNED';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly reason: string,
  ) {
    this.occurredOn = new Date();
  }
}
