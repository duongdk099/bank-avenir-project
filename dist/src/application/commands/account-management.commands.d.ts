import { ICommand } from '@nestjs/cqrs';
export declare class DirectorCreateAccountCommand implements ICommand {
    readonly userId: string;
    readonly accountType: string;
    readonly initialDeposit: number;
    readonly name?: string | undefined;
    constructor(userId: string, accountType: string, initialDeposit: number, name?: string | undefined);
}
export declare class RenameAccountCommand implements ICommand {
    readonly accountId: string;
    readonly newName: string;
    readonly requestedBy: string;
    constructor(accountId: string, newName: string, requestedBy: string);
}
export declare class CloseAccountCommand implements ICommand {
    readonly accountId: string;
    readonly reason: string;
    readonly requestedBy: string;
    constructor(accountId: string, reason: string, requestedBy: string);
}
export declare class BanAccountCommand implements ICommand {
    readonly accountId: string;
    readonly reason: string;
    readonly directorId: string;
    constructor(accountId: string, reason: string, directorId: string);
}
