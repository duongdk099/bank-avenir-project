import { IDomainEvent } from '../domain-event.interface.js';

export class AccountOpenedEvent implements IDomainEvent {
  public readonly eventType = 'ACCOUNT_OPENED';

  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly iban: string,
    public readonly accountType: string, // CHECKING, SAVINGS, INVESTMENT
    public readonly initialBalance: number,
    public readonly currency: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
