import { ICommand } from '@nestjs/cqrs';

export class GrantLoanCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
    public readonly principal: number,
    public readonly annualRate: number,
    public readonly termMonths: number,
    public readonly insuranceRate: number,
  ) {}
}
