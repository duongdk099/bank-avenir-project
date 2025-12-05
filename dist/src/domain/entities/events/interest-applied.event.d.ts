import { IDomainEvent } from '../domain-event.interface.js';
export declare class InterestAppliedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly interestAmount: number;
    readonly currency: string;
    readonly rate: number;
    readonly balanceAfter: number;
    readonly occurredOn: Date;
    readonly eventType = "INTEREST_APPLIED";
    constructor(aggregateId: string, interestAmount: number, currency: string, rate: number, balanceAfter: number, occurredOn?: Date);
}
