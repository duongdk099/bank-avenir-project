import { ICommand } from '@nestjs/cqrs';

export class PlaceOrderCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
    public readonly securityId: string,
    public readonly type: string, // BUY or SELL
    public readonly quantity: number,
    public readonly price: number,
  ) {}
}
