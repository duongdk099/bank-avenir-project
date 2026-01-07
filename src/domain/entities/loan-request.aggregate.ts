import { AggregateRoot } from './aggregate-root.js';
import { IDomainEvent } from './domain-event.interface.js';
import {
  LoanRequestedEvent,
  LoanRequestAssignedEvent,
  LoanRequestApprovedEvent,
  LoanRequestRejectedEvent,
} from './events/loan-request.events.js';

export class LoanRequestAggregate extends AggregateRoot {
  private userId: string;
  private accountId: string;
  private requestedAmount: number;
  private termMonths: number;
  private purpose: string;
  private status: 'PENDING' | 'ASSIGNED' | 'APPROVED' | 'REJECTED';
  private managerId?: string;
  private rejectionReason?: string;

  constructor(id: string) {
    super(id);
  }

  /**
   * Factory method to create a new loan request
   */
  static request(
    id: string,
    userId: string,
    accountId: string,
    requestedAmount: number,
    termMonths: number,
    purpose: string,
  ): LoanRequestAggregate {
    if (requestedAmount <= 0) {
      throw new Error('Requested amount must be positive');
    }

    if (termMonths <= 0 || termMonths > 360) {
      throw new Error('Term must be between 1 and 360 months');
    }

    const request = new LoanRequestAggregate(id);
    const event = new LoanRequestedEvent(
      id,
      userId,
      accountId,
      requestedAmount,
      termMonths,
      purpose,
    );
    request.apply(event);
    return request;
  }

  /**
   * Assign the loan request to a manager
   */
  assign(managerId: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Can only assign pending loan requests');
    }

    const event = new LoanRequestAssignedEvent(this.id, managerId);
    this.apply(event);
  }

  /**
   * Approve the loan request
   */
  approve(
    managerId: string,
    approvedAmount: number,
    annualRate: number,
    termMonths: number,
    insuranceRate: number,
  ): void {
    if (this.status !== 'ASSIGNED') {
      throw new Error('Can only approve assigned loan requests');
    }

    if (this.managerId !== managerId) {
      throw new Error('Only the assigned manager can approve this request');
    }

    const event = new LoanRequestApprovedEvent(
      this.id,
      managerId,
      approvedAmount,
      annualRate,
      termMonths,
      insuranceRate,
    );
    this.apply(event);
  }

  /**
   * Reject the loan request
   */
  reject(managerId: string, reason: string): void {
    if (this.status !== 'ASSIGNED') {
      throw new Error('Can only reject assigned loan requests');
    }

    if (this.managerId !== managerId) {
      throw new Error('Only the assigned manager can reject this request');
    }

    const event = new LoanRequestRejectedEvent(this.id, managerId, reason);
    this.apply(event);
  }

  // Event handlers
  protected applyEvent(event: IDomainEvent): void {
    switch (event.eventType) {
      case 'LOAN_REQUESTED':
        this.onLoanRequested(event as LoanRequestedEvent);
        break;
      case 'LOAN_REQUEST_ASSIGNED':
        this.onLoanRequestAssigned(event as LoanRequestAssignedEvent);
        break;
      case 'LOAN_REQUEST_APPROVED':
        this.onLoanRequestApproved(event as LoanRequestApprovedEvent);
        break;
      case 'LOAN_REQUEST_REJECTED':
        this.onLoanRequestRejected(event as LoanRequestRejectedEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }

  private onLoanRequested(event: LoanRequestedEvent): void {
    this.userId = event.userId;
    this.accountId = event.accountId;
    this.requestedAmount = event.requestedAmount;
    this.termMonths = event.termMonths;
    this.purpose = event.purpose;
    this.status = 'PENDING';
  }

  private onLoanRequestAssigned(event: LoanRequestAssignedEvent): void {
    this.managerId = event.managerId;
    this.status = 'ASSIGNED';
  }

  private onLoanRequestApproved(event: LoanRequestApprovedEvent): void {
    this.status = 'APPROVED';
  }

  private onLoanRequestRejected(event: LoanRequestRejectedEvent): void {
    this.rejectionReason = event.reason;
    this.status = 'REJECTED';
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getAccountId(): string {
    return this.accountId;
  }

  getRequestedAmount(): number {
    return this.requestedAmount;
  }

  getTermMonths(): number {
    return this.termMonths;
  }

  getPurpose(): string {
    return this.purpose;
  }

  getStatus(): string {
    return this.status;
  }

  getManagerId(): string | undefined {
    return this.managerId;
  }
}
