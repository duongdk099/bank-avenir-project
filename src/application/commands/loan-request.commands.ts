/**
 * Loan Request Commands
 *
 * Per assignment: Client requests loan → Manager assigns and approves/rejects
 */

export class RequestLoanCommand {
  constructor(
    public readonly userId: string,
    public readonly accountId: string,
    public readonly requestedAmount: number,
    public readonly termMonths: number,
    public readonly purpose: string,
  ) {}
}

export class AssignLoanRequestCommand {
  constructor(
    public readonly loanRequestId: string,
    public readonly managerId: string,
  ) {}
}

export class ApproveLoanRequestCommand {
  constructor(
    public readonly loanRequestId: string,
    public readonly managerId: string,
    public readonly approvedAmount: number,
    public readonly annualRate: number,
    public readonly termMonths: number,
    public readonly insuranceRate: number,
  ) {}
}

export class RejectLoanRequestCommand {
  constructor(
    public readonly loanRequestId: string,
    public readonly managerId: string,
    public readonly reason: string,
  ) {}
}
