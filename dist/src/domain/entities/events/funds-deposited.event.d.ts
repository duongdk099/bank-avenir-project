import { IDomainEvent } from '../domain-event.interface.js';
export declare class FundsDepositedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly amount: number;
    readonly currency: string;
    readonly balanceAfter: number;
    readonly description: string;
    readonly occurredOn: Date;
    readonly eventType = "FUNDS_DEPOSITED";
    constructor(aggregateId: string, amount: number, currency: string, balanceAfter: number, description: string, occurredOn?: Date);
}
