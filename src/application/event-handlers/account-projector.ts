import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AccountOpenedEvent } from '../../domain/entities/events/account-opened.event.js';
import { FundsDepositedEvent } from '../../domain/entities/events/funds-deposited.event.js';
import { FundsWithdrawnEvent } from '../../domain/entities/events/funds-withdrawn.event.js';
import { TransferSentEvent } from '../../domain/entities/events/transfer-sent.event.js';
import { TransferReceivedEvent } from '../../domain/entities/events/transfer-received.event.js';
import { InterestAppliedEvent } from '../../domain/entities/events/interest-applied.event.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { AccountType, OperationType } from '@prisma/client';
import { Injectable } from '@nestjs/common';

/**
 * Account Projector (Read Side)
 * Listens to domain events and updates the Prisma read model
 */

@Injectable()
@EventsHandler(AccountOpenedEvent)
export class AccountOpenedHandler implements IEventHandler<AccountOpenedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: AccountOpenedEvent) {
    await this.prisma.bankAccount.create({
      data: {
        id: event.aggregateId,
        userId: event.userId,
        iban: event.iban,
        accountType: event.accountType as AccountType,
        balance: event.initialBalance,
        currency: event.currency,
        status: 'ACTIVE',
      },
    });

    // Create initial operation if there was an initial deposit
    if (event.initialBalance > 0) {
      await this.prisma.accountOperations.create({
        data: {
          accountId: event.aggregateId,
          type: OperationType.DEPOSIT,
          amount: event.initialBalance,
          balanceAfter: event.initialBalance,
          description: 'Initial deposit',
          createdAt: event.occurredOn,
        },
      });
    }
  }
}

@Injectable()
@EventsHandler(FundsDepositedEvent)
export class FundsDepositedHandler implements IEventHandler<FundsDepositedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: FundsDepositedEvent) {
    // Update account balance
    await this.prisma.bankAccount.update({
      where: { id: event.aggregateId },
      data: { balance: event.balanceAfter },
    });

    // Record operation
    await this.prisma.accountOperations.create({
      data: {
        accountId: event.aggregateId,
        type: OperationType.DEPOSIT,
        amount: event.amount,
        balanceAfter: event.balanceAfter,
        description: event.description,
        createdAt: event.occurredOn,
      },
    });
  }
}

@Injectable()
@EventsHandler(FundsWithdrawnEvent)
export class FundsWithdrawnHandler implements IEventHandler<FundsWithdrawnEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: FundsWithdrawnEvent) {
    // Update account balance
    await this.prisma.bankAccount.update({
      where: { id: event.aggregateId },
      data: { balance: event.balanceAfter },
    });

    // Record operation
    await this.prisma.accountOperations.create({
      data: {
        accountId: event.aggregateId,
        type: OperationType.WITHDRAWAL,
        amount: event.amount,
        balanceAfter: event.balanceAfter,
        description: event.description,
        createdAt: event.occurredOn,
      },
    });
  }
}

@Injectable()
@EventsHandler(TransferSentEvent)
export class TransferSentHandler implements IEventHandler<TransferSentEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: TransferSentEvent) {
    // Update sender account balance
    await this.prisma.bankAccount.update({
      where: { id: event.aggregateId },
      data: { balance: event.balanceAfter },
    });

    // Record operation for sender
    await this.prisma.accountOperations.create({
      data: {
        accountId: event.aggregateId,
        type: OperationType.TRANSFER,
        amount: event.amount,
        balanceAfter: event.balanceAfter,
        description: event.description,
        recipientIban: event.recipientIban,
        createdAt: event.occurredOn,
      },
    });
  }
}

@Injectable()
@EventsHandler(TransferReceivedEvent)
export class TransferReceivedHandler implements IEventHandler<TransferReceivedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: TransferReceivedEvent) {
    // Update recipient account balance
    await this.prisma.bankAccount.update({
      where: { id: event.aggregateId },
      data: { balance: event.balanceAfter },
    });

    // Record operation for recipient
    await this.prisma.accountOperations.create({
      data: {
        accountId: event.aggregateId,
        type: OperationType.TRANSFER,
        amount: event.amount,
        balanceAfter: event.balanceAfter,
        description: event.description,
        senderIban: event.senderIban,
        createdAt: event.occurredOn,
      },
    });
  }
}

@Injectable()
@EventsHandler(InterestAppliedEvent)
export class InterestAppliedHandler implements IEventHandler<InterestAppliedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: InterestAppliedEvent) {
    // Update account balance
    await this.prisma.bankAccount.update({
      where: { id: event.aggregateId },
      data: { balance: event.balanceAfter },
    });

    // Record operation
    await this.prisma.accountOperations.create({
      data: {
        accountId: event.aggregateId,
        type: OperationType.DEPOSIT,
        amount: event.interestAmount,
        balanceAfter: event.balanceAfter,
        description: `Daily interest applied (${(event.rate * 100).toFixed(2)}% APR)`,
        createdAt: event.occurredOn,
      },
    });
  }
}
