import { ICommand } from '@nestjs/cqrs';

/**
 * Director Create Account Command
 * Allows directors to create accounts for clients
 */
export class DirectorCreateAccountCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly accountType: string,
    public readonly initialDeposit: number,
    public readonly name?: string,
  ) {}
}

/**
 * Rename Account Command
 */
export class RenameAccountCommand implements ICommand {
  constructor(
    public readonly accountId: string,
    public readonly newName: string,
    public readonly requestedBy: string, // userId of person making request
  ) {}
}

/**
 * Close Account Command
 */
export class CloseAccountCommand implements ICommand {
  constructor(
    public readonly accountId: string,
    public readonly reason: string,
    public readonly requestedBy: string,
  ) {}
}

/**
 * Ban Account Command (Director only)
 */
export class BanAccountCommand implements ICommand {
  constructor(
    public readonly accountId: string,
    public readonly reason: string,
    public readonly directorId: string,
  ) {}
}
