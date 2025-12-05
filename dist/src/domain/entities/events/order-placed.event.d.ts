import { IDomainEvent } from '../domain-event.interface.js';
export declare class OrderPlacedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly userId: string;
    readonly accountId: string;
    readonly securityId: string;
    readonly type: string;
    readonly quantity: number;
    readonly price: number;
    readonly status: string;
    readonly occurredOn: Date;
    readonly eventType = "ORDER_PLACED";
    constructor(aggregateId: string, userId: string, accountId: string, securityId: string, type: string, quantity: number, price: number, status: string, occurredOn?: Date);
}
