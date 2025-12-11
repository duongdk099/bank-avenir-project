import { IDomainEvent } from '../domain-event.interface.js';
export declare class AccountClosedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly reason: string;
    readonly eventType = "ACCOUNT_CLOSED";
    readonly occurredOn: Date;
    constructor(aggregateId: string, reason: string);
}
