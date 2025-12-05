import { IDomainEvent } from './domain-event.interface.js';

export abstract class AggregateRoot {
  protected id: string;
  protected version: number = -1;
  private uncommittedEvents: IDomainEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  public getId(): string {
    return this.id;
  }

  public getVersion(): number {
    return this.version;
  }

  public getUncommittedEvents(): IDomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  protected apply(event: IDomainEvent): void {
    this.uncommittedEvents.push(event);
    this.applyEvent(event);
    this.version++;
  }

  protected abstract applyEvent(event: IDomainEvent): void;

  public loadFromHistory(events: IDomainEvent[]): void {
    events.forEach((event) => {
      this.applyEvent(event);
      this.version++;
    });
  }
}
