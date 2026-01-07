import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  RequestLoanCommand,
  AssignLoanRequestCommand,
  ApproveLoanRequestCommand,
  RejectLoanRequestCommand,
} from '../commands/loan-request.commands.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { LoanRequestAggregate } from '../../domain/entities/loan-request.aggregate.js';
import { LoanAggregate } from '../../domain/entities/loan.aggregate.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request Loan Handler - Client requests a loan
 */
@CommandHandler(RequestLoanCommand)
export class RequestLoanHandler implements ICommandHandler<RequestLoanCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: RequestLoanCommand): Promise<{ loanRequestId: string }> {
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

    // Validate parameters
    if (command.requestedAmount <= 0) {
      throw new BadRequestException('Requested amount must be positive');
    }

    if (command.termMonths <= 0 || command.termMonths > 360) {
      throw new BadRequestException('Term must be between 1 and 360 months');
    }

    // Create loan request aggregate
    const loanRequestId = uuidv4();
    const loanRequest = LoanRequestAggregate.request(
      loanRequestId,
      command.userId,
      command.accountId,
      command.requestedAmount,
      command.termMonths,
      command.purpose,
    );

    // Save events to event store
    await this.eventStore.save(loanRequest, 'LoanRequest');

    return { loanRequestId };
  }
}

/**
 * Assign Loan Request Handler - Manager assigns loan request to themselves
 */
@CommandHandler(AssignLoanRequestCommand)
export class AssignLoanRequestHandler implements ICommandHandler<AssignLoanRequestCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: AssignLoanRequestCommand): Promise<{ success: boolean; conversationId: string }> {
    // Validate manager exists
    const manager = await this.prisma.user.findUnique({
      where: { id: command.managerId },
    });

    if (!manager || manager.role !== 'MANAGER') {
      throw new ForbiddenException('Only managers can assign loan requests');
    }

    // Load loan request aggregate
    const events = await this.eventStore.getEventsForAggregate(
      command.loanRequestId,
      'LoanRequest',
    );

    if (events.length === 0) {
      throw new NotFoundException('Loan request not found');
    }

    const loanRequest = new LoanRequestAggregate(command.loanRequestId);
    loanRequest.loadFromHistory(events);

    // Assign the request
    loanRequest.assign(command.managerId);

    // Save events
    await this.eventStore.save(loanRequest, 'LoanRequest');

    // Get the client user ID
    const clientId = loanRequest.getUserId();

    // Create or get existing private conversation
    let conversation = await this.prisma.privateConversation.findFirst({
      where: {
        OR: [
          { user1Id: clientId, user2Id: command.managerId },
          { user1Id: command.managerId, user2Id: clientId },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.privateConversation.create({
        data: {
          user1Id: clientId,
          user2Id: command.managerId,
        },
      });
    }

    return { success: true, conversationId: conversation.id };
  }
}

/**
 * Approve Loan Request Handler - Manager approves and grants the loan
 */
@CommandHandler(ApproveLoanRequestCommand)
export class ApproveLoanRequestHandler implements ICommandHandler<ApproveLoanRequestCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: ApproveLoanRequestCommand): Promise<{ loanId: string; monthlyPayment: number }> {
    // Load loan request aggregate
    const events = await this.eventStore.getEventsForAggregate(
      command.loanRequestId,
      'LoanRequest',
    );

    if (events.length === 0) {
      throw new NotFoundException('Loan request not found');
    }

    const loanRequest = new LoanRequestAggregate(command.loanRequestId);
    loanRequest.loadFromHistory(events);

    // Approve the request
    loanRequest.approve(
      command.managerId,
      command.approvedAmount,
      command.annualRate,
      command.termMonths,
      command.insuranceRate,
    );

    // Save events
    await this.eventStore.save(loanRequest, 'LoanRequest');

    // Create the actual loan
    const loanId = uuidv4();
    const loan = LoanAggregate.grant(
      loanId,
      loanRequest.getUserId(),
      loanRequest.getAccountId(),
      command.approvedAmount,
      command.annualRate,
      command.termMonths,
      command.insuranceRate,
    );

    // Generate schedule
    loan.generateSchedule();

    // Save loan events
    await this.eventStore.save(loan, 'Loan');

    return {
      loanId,
      monthlyPayment: loan.getMonthlyPayment(),
    };
  }
}

/**
 * Reject Loan Request Handler - Manager rejects the loan request
 */
@CommandHandler(RejectLoanRequestCommand)
export class RejectLoanRequestHandler implements ICommandHandler<RejectLoanRequestCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  async execute(command: RejectLoanRequestCommand): Promise<{ success: boolean }> {
    // Load loan request aggregate
    const events = await this.eventStore.getEventsForAggregate(
      command.loanRequestId,
      'LoanRequest',
    );

    if (events.length === 0) {
      throw new NotFoundException('Loan request not found');
    }

    const loanRequest = new LoanRequestAggregate(command.loanRequestId);
    loanRequest.loadFromHistory(events);

    // Reject the request
    loanRequest.reject(command.managerId, command.reason);

    // Save events
    await this.eventStore.save(loanRequest, 'LoanRequest');

    return { success: true };
  }
}
