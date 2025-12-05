import { IDomainEvent } from '../domain-event.interface.js';
export declare class FundsWithdrawnEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly amount: number;
    readonly currency: string;
    readonly balanceAfter: number;
    readonly description: string;
    readonly occurredOn: Date;
    readonly eventType = "FUNDS_WITHDRAWN";
    constructor(aggregateId: string, amount: number, currency: string, balanceAfter: number, description: string, occurredOn?: Date);
}
