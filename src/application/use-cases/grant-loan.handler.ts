import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GrantLoanCommand } from '../commands/grant-loan.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { LoanAggregate } from '../../domain/entities/loan.aggregate.js';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(GrantLoanCommand)
export class GrantLoanHandler implements ICommandHandler<GrantLoanCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: GrantLoanCommand): Promise<{ loanId: string; monthlyPayment: number; totalAmount: number }> {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate account exists and belongs to user
    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: command.accountId,
        userId: command.userId,
        status: 'ACTIVE',
      },
    });

    if (!account) {
      throw new NotFoundException('Active account not found for this user');
    }

    // Validate loan parameters
    if (command.principal <= 0) {
      throw new BadRequestException('Principal must be positive');
    }

    if (command.annualRate < 0) {
      throw new BadRequestException('Annual rate cannot be negative');
    }

    if (command.termMonths <= 0 || command.termMonths > 360) {
      throw new BadRequestException('Term must be between 1 and 360 months');
    }

    if (command.insuranceRate < 0 || command.insuranceRate > 0.1) {
      throw new BadRequestException('Insurance rate must be between 0 and 0.1 (10%)');
    }

    // Create loan aggregate
    const loanId = uuidv4();
    const loan = LoanAggregate.grant(
      loanId,
      command.userId,
      command.accountId,
      command.principal,
      command.annualRate,
      command.termMonths,
      command.insuranceRate,
    );

    // Generate amortization schedule
    loan.generateSchedule();

    // Save events to event store
    await this.eventStore.save(loan, 'Loan');

    return {
      loanId,
      monthlyPayment: loan.getMonthlyPayment(),
      totalAmount: loan.getTotalAmount(),
    };
  }
}
