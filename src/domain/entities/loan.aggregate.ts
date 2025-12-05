import { AggregateRoot } from './aggregate-root.js';
import { IDomainEvent } from './domain-event.interface.js';
import { LoanGrantedEvent } from './events/loan-granted.event.js';
import {
  LoanScheduleGeneratedEvent,
  LoanSchedulePayment,
} from './events/loan-schedule-generated.event.js';

export class LoanAggregate extends AggregateRoot {
  private userId: string;
  private accountId: string;
  private principal: number;
  private annualRate: number;
  private termMonths: number;
  private insuranceRate: number;
  private monthlyPayment: number;
  private totalAmount: number;
  private status: string;
  private schedule: LoanSchedulePayment[];

  constructor(id: string) {
    super(id);
  }

  /**
   * Factory method to grant a new loan
   */
  static grant(
    id: string,
    userId: string,
    accountId: string,
    principal: number,
    annualRate: number,
    termMonths: number,
    insuranceRate: number,
  ): LoanAggregate {
    if (principal <= 0) {
      throw new Error('Principal must be positive');
    }

    if (annualRate < 0) {
      throw new Error('Annual rate cannot be negative');
    }

    if (termMonths <= 0) {
      throw new Error('Term must be positive');
    }

    if (insuranceRate < 0) {
      throw new Error('Insurance rate cannot be negative');
    }

    const loan = new LoanAggregate(id);

    // Calculate monthly payment using amortization formula
    const monthlyRate = annualRate / 12;
    let monthlyPaymentWithoutInsurance: number;

    if (monthlyRate === 0) {
      // No interest case
      monthlyPaymentWithoutInsurance = principal / termMonths;
    } else {
      // Standard amortization formula: P * r / (1 - (1 + r)^(-n))
      monthlyPaymentWithoutInsurance =
        (principal * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -termMonths));
    }

    // Insurance is calculated on initial capital (principal)
    const monthlyInsurance = (principal * insuranceRate) / termMonths;

    // Total monthly payment
    const totalMonthlyPayment =
      monthlyPaymentWithoutInsurance + monthlyInsurance;

    // Calculate total amount to be repaid
    const totalAmount = totalMonthlyPayment * termMonths;

    const event = new LoanGrantedEvent(
      id,
      userId,
      accountId,
      principal,
      annualRate,
      termMonths,
      insuranceRate,
      totalMonthlyPayment,
      totalAmount,
      'APPROVED',
    );
    loan.apply(event);
    return loan;
  }

  /**
   * Generate the complete amortization schedule
   */
  generateSchedule(): void {
    if (!this.principal || !this.termMonths) {
      throw new Error('Loan not properly initialized');
    }

    const schedule: LoanSchedulePayment[] = [];
    let remainingBalance = this.principal;
    const monthlyRate = this.annualRate / 12;
    const monthlyInsurance = (this.principal * this.insuranceRate) / this.termMonths;

    for (let month = 1; month <= this.termMonths; month++) {
      // Interest on remaining balance
      const interest = remainingBalance * monthlyRate;

      // Principal payment = total payment - interest - insurance
      let principalPayment = this.monthlyPayment - interest - monthlyInsurance;

      // Handle rounding issues on last payment
      if (month === this.termMonths) {
        principalPayment = remainingBalance;
      }

      // Ensure principal payment doesn't exceed remaining balance
      if (principalPayment > remainingBalance) {
        principalPayment = remainingBalance;
      }

      const totalPayment = principalPayment + interest + monthlyInsurance;
      remainingBalance -= principalPayment;

      // Ensure remaining balance doesn't go negative due to rounding
      if (remainingBalance < 0.01) {
        remainingBalance = 0;
      }

      schedule.push({
        month,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        insurance: Math.round(monthlyInsurance * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.round(remainingBalance * 100) / 100,
      });
    }

    const event = new LoanScheduleGeneratedEvent(this.id, schedule);
    this.apply(event);
  }

  // Event handlers
  protected applyEvent(event: IDomainEvent): void {
    switch (event.eventType) {
      case 'LOAN_GRANTED':
        this.onLoanGranted(event as LoanGrantedEvent);
        break;
      case 'LOAN_SCHEDULE_GENERATED':
        this.onLoanScheduleGenerated(event as LoanScheduleGeneratedEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }

  private onLoanGranted(event: LoanGrantedEvent): void {
    this.userId = event.userId;
    this.accountId = event.accountId;
    this.principal = event.principal;
    this.annualRate = event.annualRate;
    this.termMonths = event.termMonths;
    this.insuranceRate = event.insuranceRate;
    this.monthlyPayment = event.monthlyPayment;
    this.totalAmount = event.totalAmount;
    this.status = event.status;
  }

  private onLoanScheduleGenerated(event: LoanScheduleGeneratedEvent): void {
    this.schedule = event.schedule;
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getAccountId(): string {
    return this.accountId;
  }

  getPrincipal(): number {
    return this.principal;
  }

  getAnnualRate(): number {
    return this.annualRate;
  }

  getTermMonths(): number {
    return this.termMonths;
  }

  getInsuranceRate(): number {
    return this.insuranceRate;
  }

  getMonthlyPayment(): number {
    return this.monthlyPayment;
  }

  getTotalAmount(): number {
    return this.totalAmount;
  }

  getStatus(): string {
    return this.status;
  }

  getSchedule(): LoanSchedulePayment[] {
    return this.schedule;
  }
}
