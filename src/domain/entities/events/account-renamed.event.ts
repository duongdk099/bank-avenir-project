import { IDomainEvent } from '../domain-event.interface.js';

export class AccountRenamedEvent implements IDomainEvent {
  public readonly eventType = 'ACCOUNT_RENAMED';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly newName: string,
  ) {
    this.occurredOn = new Date();
  }
}
