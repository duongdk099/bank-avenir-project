import { IDomainEvent } from '../domain-event.interface.js';
export declare class OrderExecutedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly matchedOrderId: string;
    readonly executedQuantity: number;
    readonly executedPrice: number;
    readonly fee: number;
    readonly occurredOn: Date;
    readonly eventType = "ORDER_EXECUTED";
    constructor(aggregateId: string, matchedOrderId: string, executedQuantity: number, executedPrice: number, fee: number, occurredOn?: Date);
}
