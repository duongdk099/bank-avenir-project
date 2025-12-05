import { IDomainEvent } from '../domain-event.interface.js';
export declare class TransferReceivedEvent implements IDomainEvent {
    readonly aggregateId: string;
    readonly senderAccountId: string;
    readonly senderIban: string;
    readonly amount: number;
    readonly currency: string;
    readonly balanceAfter: number;
    readonly description: string;
    readonly occurredOn: Date;
    readonly eventType = "TRANSFER_RECEIVED";
    constructor(aggregateId: string, senderAccountId: string, senderIban: string, amount: number, currency: string, balanceAfter: number, description: string, occurredOn?: Date);
}
