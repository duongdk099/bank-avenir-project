import { IDomainEvent } from '../domain-event.interface.js';

export class UserEmailConfirmedEvent implements IDomainEvent {
  public readonly eventType = 'USER_EMAIL_CONFIRMED';

  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
