import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  ClientRenameAccountCommand,
  ClientDeleteAccountCommand,
} from '../commands/client-account.commands.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { BankAccountAggregate } from '../../domain/entities/bank-account.aggregate.js';

/**
 * Client Rename Account Handler
 * Allows clients to rename their own accounts only
 */
@CommandHandler(ClientRenameAccountCommand)
export class ClientRenameAccountHandler implements ICommandHandler<ClientRenameAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: ClientRenameAccountCommand): Promise<{ success: boolean }> {
    // Load account from read model to verify ownership
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: command.accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Verify client owns this account
    if (account.userId !== command.clientId) {
      throw new ForbiddenException('You can only rename your own accounts');
    }

    // Update the account name in the read model
    await this.prisma.bankAccount.update({
      where: { id: command.accountId },
      data: { name: command.newName },
    });

    return { success: true };
  }
}

/**
 * Client Delete Account Handler
 * Allows clients to delete their own accounts (with zero balance)
 */
@CommandHandler(ClientDeleteAccountCommand)
export class ClientDeleteAccountHandler implements ICommandHandler<ClientDeleteAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: ClientDeleteAccountCommand): Promise<{ success: boolean }> {
    // Load account from read model to verify ownership
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: command.accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Verify client owns this account
    if (account.userId !== command.clientId) {
      throw new ForbiddenException('You can only delete your own accounts');
    }

    // Verify balance is zero
    if (account.balance.toNumber() !== 0) {
      throw new ForbiddenException('Account must have zero balance before deletion');
    }

    // Check for pending orders
    const pendingOrders = await this.prisma.order.count({
      where: {
        accountId: command.accountId,
        status: 'PENDING',
      },
    });

    if (pendingOrders > 0) {
      throw new ForbiddenException('Cannot delete account with pending orders');
    }

    // Check for active loans
    const activeLoans = await this.prisma.loan.count({
      where: {
        accountId: command.accountId,
        status: { in: ['ACTIVE', 'PENDING', 'APPROVED'] },
      },
    });

    if (activeLoans > 0) {
      throw new ForbiddenException('Cannot delete account with active loans');
    }

    // Delete the account (cascade will handle related records)
    await this.prisma.bankAccount.delete({
      where: { id: command.accountId },
    });

    return { success: true };
  }
}
