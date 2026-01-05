import { ICommand } from '@nestjs/cqrs';

/**
 * Client Rename Account Command
 * Allows clients to rename their own accounts
 * Per assignment: "modifier son nom personnalisé si je le souhaite"
 */
export class ClientRenameAccountCommand implements ICommand {
  constructor(
    public readonly accountId: string,
    public readonly newName: string,
    public readonly clientId: string,
  ) {}
}

/**
 * Client Delete Account Command
 * Allows clients to delete their own accounts
 * Per assignment: "Je dois pouvoir supprimer le compte"
 */
export class ClientDeleteAccountCommand implements ICommand {
  constructor(
    public readonly accountId: string,
    public readonly clientId: string,
    public readonly reason: string,
  ) {}
}
