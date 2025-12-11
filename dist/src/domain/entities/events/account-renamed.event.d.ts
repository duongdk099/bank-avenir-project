import { IDomainEvent } from '../domain-event.interface.js';
export declare class AccountRenamedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly newName: string;
    readonly eventType = "ACCOUNT_RENAMED";
    readonly occurredOn: Date;
    constructor(aggregateId: string, newName: string);
}
