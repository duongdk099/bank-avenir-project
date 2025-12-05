import { IDomainEvent } from '../domain-event.interface.js';
export interface LoanSchedulePayment {
    month: number;
    principal: number;
    interest: number;
    insurance: number;
    totalPayment: number;
    remainingBalance: number;
}
export declare class LoanScheduleGeneratedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly schedule: LoanSchedulePayment[];
    readonly occurredOn: Date;
    readonly eventType = "LOAN_SCHEDULE_GENERATED";
    constructor(aggregateId: string, schedule: LoanSchedulePayment[], occurredOn?: Date);
}
