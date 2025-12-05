import { IDomainEvent } from '../domain-event.interface.js';
export declare class UserRegisteredEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly email: string;
    readonly passwordHash: string;
    readonly role: string;
    readonly occurredOn: Date;
    readonly eventType = "USER_REGISTERED";
    constructor(aggregateId: string, email: string, passwordHash: string, role: string, occurredOn?: Date);
}
