import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { LoanGrantedEvent } from '../../domain/entities/events/loan-granted.event.js';
import { LoanScheduleGeneratedEvent } from '../../domain/entities/events/loan-schedule-generated.event.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { LoanStatus } from '@prisma/client';

/**
 * Loan Projectors (Read Side)
 * Updates loans and loan_schedules tables based on domain events
 */

@Injectable()
@EventsHandler(LoanGrantedEvent)
export class LoanGrantedHandler implements IEventHandler<LoanGrantedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: LoanGrantedEvent) {
    await this.prisma.loan.create({
      data: {
        id: event.aggregateId,
        userId: event.userId,
        accountId: event.accountId,
        amount: event.principal,
        interestRate: event.annualRate,
        insuranceRate: event.insuranceRate,
        durationMonths: event.termMonths,
        monthlyPayment: event.monthlyPayment,
        status: 'ACTIVE' as LoanStatus,
        createdAt: event.occurredOn,
        approvalDate: event.occurredOn,
      },
    });

    // Credit the loan amount to the account
    await this.prisma.bankAccount.update({
      where: { id: event.accountId },
      data: {
        balance: {
          increment: event.principal,
        },
      },
    });
  }
}

@Injectable()
@EventsHandler(LoanScheduleGeneratedEvent)
export class LoanScheduleGeneratedHandler
  implements IEventHandler<LoanScheduleGeneratedEvent>
{
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: LoanScheduleGeneratedEvent) {
    // Create all schedule entries
    const scheduleData = event.schedule.map((payment) => ({
      loanId: event.aggregateId,
      installmentNumber: payment.month,
      principalAmount: payment.principal,
      interestAmount: payment.interest,
      insuranceAmount: payment.insurance,
      totalAmount: payment.totalPayment,
      dueDate: this.calculateDueDate(event.occurredOn, payment.month),
      isPaid: false,
    }));

    await this.prisma.loanSchedule.createMany({
      data: scheduleData,
    });
  }

  private calculateDueDate(startDate: Date, monthOffset: number): Date {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + monthOffset);
    return dueDate;
  }
}
