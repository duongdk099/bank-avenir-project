import { IDomainEvent } from '../domain-event.interface.js';
export declare class TransferSentEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly recipientAccountId: string;
    readonly recipientIban: string;
    readonly amount: number;
    readonly currency: string;
    readonly balanceAfter: number;
    readonly description: string;
    readonly occurredOn: Date;
    readonly eventType = "TRANSFER_SENT";
    constructor(aggregateId: string, recipientAccountId: string, recipientIban: string, amount: number, currency: string, balanceAfter: number, description: string, occurredOn?: Date);
}
