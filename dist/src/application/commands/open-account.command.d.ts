import { ICommand } from '@nestjs/cqrs';
export declare class OpenAccountCommand implements ICommand {
    readonly userId: string;
    readonly accountType: string;
    readonly initialDeposit?: number | undefined;
    constructor(userId: string, accountType: string, initialDeposit?: number | undefined);
}
