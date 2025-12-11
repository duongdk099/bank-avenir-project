import { IDomainEvent } from '../domain-event.interface.js';
export declare class AccountBannedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly reason: string;
    readonly eventType = "ACCOUNT_BANNED";
    readonly occurredOn: Date;
    constructor(aggregateId: string, reason: string);
}
