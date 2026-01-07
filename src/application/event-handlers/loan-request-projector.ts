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
      title: 'Nouvelle demande de crédit',
      message: `Un client a demandé un crédit de ${event.requestedAmount}€ sur ${event.termMonths} mois. Motif: ${event.purpose}`,
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
          title: 'Demande de crédit prise en charge',
          message: `Votre demande de crédit de ${loanRequest.requestedAmount}€ a été prise en charge par un conseiller. Vous pouvez maintenant discuter avec lui.`,
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
          title: 'Crédit approuvé ! 🎉',
          message: `Félicitations ! Votre demande de crédit a été approuvée. Montant: ${event.approvedAmount}€ sur ${event.termMonths} mois au taux de ${(event.annualRate * 100).toFixed(2)}%.`,
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
          title: 'Demande de crédit refusée',
          message: `Votre demande de crédit a été refusée. Raison: ${event.reason}`,
          type: 'LOAN_REJECTED',
          metadata: JSON.stringify({ loanRequestId: event.aggregateId }),
        },
      });
    }
  }
}
