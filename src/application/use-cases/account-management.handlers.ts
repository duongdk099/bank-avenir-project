import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  DirectorCreateAccountCommand,
  RenameAccountCommand,
  CloseAccountCommand,
  BanAccountCommand,
} from '../commands/account-management.commands.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { BankAccountAggregate } from '../../domain/entities/bank-account.aggregate.js';
import { IbanService } from '../../infrastructure/services/iban.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Director Create Account Handler
 */
@CommandHandler(DirectorCreateAccountCommand)
export class DirectorCreateAccountHandler implements ICommandHandler<DirectorCreateAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
    private readonly ibanService: IbanService,
  ) {}

  async execute(command: DirectorCreateAccountCommand): Promise<{ accountId: string; iban: string }> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate account type
    const validTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT'];
    if (!validTypes.includes(command.accountType)) {
      throw new BadRequestException(`Invalid account type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate initial deposit
    if (command.initialDeposit < 0) {
      throw new BadRequestException('Initial deposit cannot be negative');
    }

    // Generate IBAN
    const iban = await this.ibanService.generateIban();

    // Create account aggregate
    const accountId = uuidv4();
    const account = BankAccountAggregate.open(
      accountId,
      command.userId,
      iban.getValue(),
      command.accountType,
      command.initialDeposit || 0,
    );

    // Save events to event store (this will trigger AccountOpenedHandler projector)
    await this.eventStore.save(account, 'BankAccountAggregate');

    return { accountId, iban: iban.getValue() };
  }
}

/**
 * Rename Account Handler
 */
@CommandHandler(RenameAccountCommand)
export class RenameAccountHandler implements ICommandHandler<RenameAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: RenameAccountCommand): Promise<{ success: boolean }> {
    // Load account from read model to verify ownership
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: command.accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check if user owns the account or is admin
    const requester = await this.prisma.user.findUnique({
      where: { id: command.requestedBy },
    });

    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const isOwner = account.userId === command.requestedBy;
    const isAdmin = requester.role === 'ADMIN' || requester.role === 'MANAGER';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to rename this account');
    }

    // Load aggregate from event store
    const aggregate = await this.eventStore.get<BankAccountAggregate>(
      command.accountId,
      BankAccountAggregate,
    );

    if (!aggregate) {
      throw new NotFoundException('Account aggregate not found');
    }

    // Execute domain logic
    aggregate.rename(command.newName);

    // Save events
    await this.eventStore.save(aggregate, 'BankAccount');

    return { success: true };
  }
}

/**
 * Close Account Handler
 */
@CommandHandler(CloseAccountCommand)
export class CloseAccountHandler implements ICommandHandler<CloseAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: CloseAccountCommand): Promise<{ success: boolean }> {
    // Load account from read model to verify ownership
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: command.accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check if user owns the account or is admin
    const requester = await this.prisma.user.findUnique({
      where: { id: command.requestedBy },
    });

    if (!requester) {
      throw new NotFoundException('User not found');
    }

    const isOwner = account.userId === command.requestedBy;
    const isAdmin = requester.role === 'ADMIN' || requester.role === 'MANAGER';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to close this account');
    }

    // Load aggregate from event store
    const aggregate = await this.eventStore.get<BankAccountAggregate>(
      command.accountId,
      BankAccountAggregate,
    );

    if (!aggregate) {
      throw new NotFoundException('Account aggregate not found');
    }

    // Execute domain logic
    aggregate.close(command.reason);

    // Save events
    await this.eventStore.save(aggregate, 'BankAccount');

    return { success: true };
  }
}

/**
 * Ban Account Handler (Director only)
 */
@CommandHandler(BanAccountCommand)
export class BanAccountHandler implements ICommandHandler<BanAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: BanAccountCommand): Promise<{ success: boolean }> {
    // Verify director permissions
    const director = await this.prisma.user.findUnique({
      where: { id: command.directorId },
    });

    if (!director || director.role !== 'ADMIN') {
      throw new ForbiddenException('Only directors can ban accounts');
    }

    // Load account from read model
    const account = await this.prisma.bankAccount.findUnique({
      where: { id: command.accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Load aggregate from event store
    const aggregate = await this.eventStore.get<BankAccountAggregate>(
      command.accountId,
      BankAccountAggregate,
    );

    if (!aggregate) {
      throw new NotFoundException('Account aggregate not found');
    }

    // Execute domain logic
    aggregate.ban(command.reason);

    // Save events
    await this.eventStore.save(aggregate, 'BankAccount');

    return { success: true };
  }
}
