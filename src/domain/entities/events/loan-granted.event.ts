import { IDomainEvent } from '../domain-event.interface.js';

export class LoanGrantedEvent implements IDomainEvent {
  public readonly eventType = 'LOAN_GRANTED';

  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly accountId: string,
    public readonly principal: number,
    public readonly annualRate: number,
    public readonly termMonths: number,
    public readonly insuranceRate: number,
    public readonly monthlyPayment: number,
    public readonly totalAmount: number,
    public readonly status: string, // PENDING, APPROVED, ACTIVE, COMPLETED, DEFAULTED
    public readonly occurredOn: Date = new Date(),
  ) {}
}
