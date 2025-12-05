import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OpenAccountCommand } from '../commands/open-account.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { IbanService } from '../../infrastructure/services/iban.service.js';
import { BankAccountAggregate } from '../../domain/entities/bank-account.aggregate.js';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(OpenAccountCommand)
export class OpenAccountHandler implements ICommandHandler<OpenAccountCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
    private readonly ibanService: IbanService,
  ) {}

  async execute(command: OpenAccountCommand): Promise<{ accountId: string; iban: string }> {
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
      throw new BadRequestException(
        `Invalid account type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    // Validate initial deposit
    const initialDeposit = command.initialDeposit ?? 0;
    if (initialDeposit < 0) {
      throw new BadRequestException('Initial deposit cannot be negative');
    }

    // Generate unique IBAN
    const iban = await this.ibanService.generateIban();

    // Create account aggregate
    const accountId = uuidv4();
    const account = BankAccountAggregate.open(
      accountId,
      command.userId,
      iban.getValue(),
      command.accountType,
      initialDeposit,
    );

    // Save events to event store
    await this.eventStore.save(account, 'BankAccount');

    return {
      accountId,
      iban: iban.getFormatted(),
    };
  }
}
