import { IDomainEvent } from '../domain-event.interface.js';
export declare class OrderCancelledEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly reason: string;
    readonly occurredOn: Date;
    readonly eventType = "ORDER_CANCELLED";
    constructor(aggregateId: string, reason: string, occurredOn?: Date);
}
