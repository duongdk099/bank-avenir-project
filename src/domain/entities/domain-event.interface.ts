export interface IDomainEvent {
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
}
