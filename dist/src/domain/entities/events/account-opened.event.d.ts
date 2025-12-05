import { IDomainEvent } from '../domain-event.interface.js';
export declare class AccountOpenedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly userId: string;
    readonly iban: string;
    readonly accountType: string;
    readonly initialBalance: number;
    readonly currency: string;
    readonly occurredOn: Date;
    readonly eventType = "ACCOUNT_OPENED";
    constructor(aggregateId: string, userId: string, iban: string, accountType: string, initialBalance: number, currency: string, occurredOn?: Date);
}
