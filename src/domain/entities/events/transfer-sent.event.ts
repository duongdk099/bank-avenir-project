import { IDomainEvent } from '../domain-event.interface.js';

export class TransferSentEvent implements IDomainEvent {
  public readonly eventType = 'TRANSFER_SENT';

  constructor(
    public readonly aggregateId: string,
    public readonly recipientAccountId: string,
    public readonly recipientIban: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly balanceAfter: number,
    public readonly description: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
