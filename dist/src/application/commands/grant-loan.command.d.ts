import { ICommand } from '@nestjs/cqrs';
export declare class GrantLoanCommand implements ICommand {
    readonly userId: string;
    readonly accountId: string;
    readonly principal: number;
    readonly annualRate: number;
    readonly termMonths: number;
    readonly insuranceRate: number;
    constructor(userId: string, accountId: string, principal: number, annualRate: number, termMonths: number, insuranceRate: number);
}
