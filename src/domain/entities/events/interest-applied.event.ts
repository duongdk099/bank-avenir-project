import { IDomainEvent } from '../domain-event.interface.js';

export class InterestAppliedEvent implements IDomainEvent {
  public readonly eventType = 'INTEREST_APPLIED';

  constructor(
    public readonly aggregateId: string,
    public readonly interestAmount: number,
    public readonly currency: string,
    public readonly rate: number,
    public readonly balanceAfter: number,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
