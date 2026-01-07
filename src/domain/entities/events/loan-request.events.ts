import { IDomainEvent } from '../domain-event.interface.js';

export class LoanRequestedEvent implements IDomainEvent {
  readonly eventType = 'LOAN_REQUESTED';
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly accountId: string,
    public readonly requestedAmount: number,
    public readonly termMonths: number,
    public readonly purpose: string,
  ) {
    this.occurredOn = new Date();
  }
}

export class LoanRequestAssignedEvent implements IDomainEvent {
  readonly eventType = 'LOAN_REQUEST_ASSIGNED';
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly managerId: string,
  ) {
    this.occurredOn = new Date();
  }
}

export class LoanRequestApprovedEvent implements IDomainEvent {
  readonly eventType = 'LOAN_REQUEST_APPROVED';
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly managerId: string,
    public readonly approvedAmount: number,
    public readonly annualRate: number,
    public readonly termMonths: number,
    public readonly insuranceRate: number,
  ) {
    this.occurredOn = new Date();
  }
}

export class LoanRequestRejectedEvent implements IDomainEvent {
  readonly eventType = 'LOAN_REQUEST_REJECTED';
  readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly managerId: string,
    public readonly reason: string,
  ) {
    this.occurredOn = new Date();
  }
}
