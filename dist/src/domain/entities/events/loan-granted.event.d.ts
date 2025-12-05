import { IDomainEvent } from '../domain-event.interface.js';
export declare class LoanGrantedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly userId: string;
    readonly accountId: string;
    readonly principal: number;
    readonly annualRate: number;
    readonly termMonths: number;
    readonly insuranceRate: number;
    readonly monthlyPayment: number;
    readonly totalAmount: number;
    readonly status: string;
    readonly occurredOn: Date;
    readonly eventType = "LOAN_GRANTED";
    constructor(aggregateId: string, userId: string, accountId: string, principal: number, annualRate: number, termMonths: number, insuranceRate: number, monthlyPayment: number, totalAmount: number, status: string, occurredOn?: Date);
}
