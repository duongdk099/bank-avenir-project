import { IDomainEvent } from './domain-event.interface.js';
export declare abstract class AggregateRoot {
    protected id: string;
    protected version: number;
    private uncommittedEvents;
    constructor(id: string);
    getId(): string;
    getVersion(): number;
    getUncommittedEvents(): IDomainEvent[];
    markEventsAsCommitted(): void;
    protected apply(event: IDomainEvent): void;
    protected abstract applyEvent(event: IDomainEvent): void;
    loadFromHistory(events: IDomainEvent[]): void;
}
