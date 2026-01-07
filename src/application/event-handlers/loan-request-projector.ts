import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import {
  LoanRequestedEvent,
  LoanRequestAssignedEvent,
  LoanRequestApprovedEvent,
  LoanRequestRejectedEvent,
} from '../../domain/entities/events/loan-request.events.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';

/**
 * Loan Request Projectors (Read Side)
 * Updates loan_requests table based on domain events
 */

@Injectable()
@EventsHandler(LoanRequestedEvent)
export class LoanRequestedHandler implements IEventHandler<LoanRequestedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: LoanRequestedEvent) {
    await this.prisma.loanRequest.create({
      data: {
        id: event.aggregateId,
        userId: event.userId,
        accountId: event.accountId,
        requestedAmount: event.requestedAmount,
        termMonths: event.termMonths,
        purpose: event.purpose,
        status: 'PENDING',
        createdAt: event.occurredOn,
      },
    });

    // Create a notification for all managers
    const managers = await this.prisma.user.findMany({
      where: { role: 'MANAGER' },
    });

    const notifications = managers.map((manager) => ({
      userId: manager.id,
      title: 'New Loan Request',
      message: `A client has requested a loan of €${event.requestedAmount} over ${event.termMonths} months. Purpose: ${event.purpose}`,
      type: 'LOAN_REQUEST',
      metadata: JSON.stringify({ loanRequestId: event.aggregateId }),
    }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications,
      });
    }
  }
}

@Injectable()
@EventsHandler(LoanRequestAssignedEvent)
export class LoanRequestAssignedHandler implements IEventHandler<LoanRequestAssignedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: LoanRequestAssignedEvent) {
    await this.prisma.loanRequest.update({
      where: { id: event.aggregateId },
      data: {
        managerId: event.managerId,
        status: 'ASSIGNED',
        assignedAt: event.occurredOn,
      },
    });

    // Get loan request details
    const loanRequest = await this.prisma.loanRequest.findUnique({
      where: { id: event.aggregateId },
    });

    if (loanRequest) {
      // Notify the client that their request has been assigned
      await this.prisma.notification.create({
        data: {
          userId: loanRequest.userId,
          title: 'Loan Request Assigned',
          message: `Your loan request for €${loanRequest.requestedAmount} has been assigned to an advisor. You can now discuss with them.`,
          type: 'LOAN_REQUEST_ASSIGNED',
          metadata: JSON.stringify({ loanRequestId: event.aggregateId }),
        },
      });
    }
  }
}

@Injectable()
@EventsHandler(LoanRequestApprovedEvent)
export class LoanRequestApprovedHandler implements IEventHandler<LoanRequestApprovedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: LoanRequestApprovedEvent) {
    await this.prisma.loanRequest.update({
      where: { id: event.aggregateId },
      data: {
        status: 'APPROVED',
        approvedAmount: event.approvedAmount,
        approvedRate: event.annualRate,
        approvedTermMonths: event.termMonths,
        approvedAt: event.occurredOn,
      },
    });

    // Get loan request details
    const loanRequest = await this.prisma.loanRequest.findUnique({
      where: { id: event.aggregateId },
    });

    if (loanRequest) {
      // Notify the client
      await this.prisma.notification.create({
        data: {
          userId: loanRequest.userId,
          title: 'Loan Approved! 🎉',
          message: `Congratulations! Your loan request has been approved. Amount: €${event.approvedAmount} over ${event.termMonths} months at ${(event.annualRate * 100).toFixed(2)}% annual rate.`,
          type: 'LOAN_APPROVED',
          metadata: JSON.stringify({ loanRequestId: event.aggregateId }),
        },
      });
    }
  }
}

@Injectable()
@EventsHandler(LoanRequestRejectedEvent)
export class LoanRequestRejectedHandler implements IEventHandler<LoanRequestRejectedEvent> {
  constructor(private readonly prisma: PrismaService) {}

  async handle(event: LoanRequestRejectedEvent) {
    await this.prisma.loanRequest.update({
      where: { id: event.aggregateId },
      data: {
        status: 'REJECTED',
        rejectionReason: event.reason,
        rejectedAt: event.occurredOn,
      },
    });

    // Get loan request details
    const loanRequest = await this.prisma.loanRequest.findUnique({
      where: { id: event.aggregateId },
    });

    if (loanRequest) {
      // Notify the client
      await this.prisma.notification.create({
        data: {
          userId: loanRequest.userId,
          title: 'Loan Request Rejected',
          message: `Your loan request has been rejected. Reason: ${event.reason}`,
          type: 'LOAN_REJECTED',
          metadata: JSON.stringify({ loanRequestId: event.aggregateId }),
        },
      });
    }
  }
}
