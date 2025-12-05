import { IDomainEvent } from '../domain-event.interface.js';

export class TransferReceivedEvent implements IDomainEvent {
  public readonly eventType = 'TRANSFER_RECEIVED';

  constructor(
    public readonly aggregateId: string,
    public readonly senderAccountId: string,
    public readonly senderIban: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly balanceAfter: number,
    public readonly description: string,
    public readonly occurredOn: Date = new Date(),
  ) {}
}
