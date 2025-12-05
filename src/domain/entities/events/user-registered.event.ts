import { IDomainEvent } from '../domain-event.interface.js';

export class UserRegisteredEvent implements IDomainEvent {
  public readonly eventType = 'USER_REGISTERED';

  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
