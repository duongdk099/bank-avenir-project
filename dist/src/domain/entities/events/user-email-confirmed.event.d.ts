import { IDomainEvent } from '../domain-event.interface.js';
export declare class UserEmailConfirmedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly email: string;
    readonly occurredOn: Date;
    readonly eventType = "USER_EMAIL_CONFIRMED";
    constructor(aggregateId: string, email: string, occurredOn?: Date);
}
