import { IDomainEvent } from '../domain-event.interface.js';

export interface LoanSchedulePayment {
  month: number;
  principal: number;
  interest: number;
  insurance: number;
  totalPayment: number;
  remainingBalance: number;
}

export class LoanScheduleGeneratedEvent implements IDomainEvent {
  public readonly eventType = 'LOAN_SCHEDULE_GENERATED';

  constructor(
    public readonly aggregateId: string,
    public readonly schedule: LoanSchedulePayment[],
    public readonly occurredOn: Date = new Date(),
  ) {}
}
