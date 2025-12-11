import { IDomainEvent } from '../domain-event.interface.js';
export declare class SavingsRateChangedEvent implements IDomainEvent {
    readonly accountType: string;
    readonly oldRate: number;
    readonly newRate: number;
    readonly minBalance: number;
    readonly effectiveDate: Date;
    readonly eventType = "SAVINGS_RATE_CHANGED";
    readonly aggregateId = "SYSTEM";
    readonly occurredOn: Date;
    constructor(accountType: string, oldRate: number, newRate: number, minBalance: number, effectiveDate: Date);
}
