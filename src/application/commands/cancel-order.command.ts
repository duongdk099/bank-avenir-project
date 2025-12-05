export class CancelOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly reason: string = 'User cancelled',
  ) {}
}
