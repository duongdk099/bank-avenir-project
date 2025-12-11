import { IDomainEvent } from '../domain-event.interface.js';

export class SavingsRateChangedEvent implements IDomainEvent {
  public readonly eventType = 'SAVINGS_RATE_CHANGED';
  public readonly aggregateId = 'SYSTEM'; // System-level event
  public readonly occurredOn: Date;

  constructor(
    public readonly accountType: string,
    public readonly oldRate: number,
    public readonly newRate: number,
    public readonly minBalance: number,
    public readonly effectiveDate: Date,
  ) {
    this.occurredOn = new Date();
  }
}
