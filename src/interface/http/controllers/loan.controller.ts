import { Body, Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { GrantLoanCommand } from '../../../application/commands/grant-loan.command.js';
import {
  RequestLoanCommand,
  AssignLoanRequestCommand,
  ApproveLoanRequestCommand,
  RejectLoanRequestCommand,
} from '../../../application/commands/loan-request.commands.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';

/**
 * Loan Controller
 * 
 * Per assignment: "en tant que conseiller bancaire, je peux être amené à octroyer des crédit"
 * Only MANAGER (Conseiller) role can grant loans
 */
@Controller('loans')
export class LoanController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Grant a new loan (MANAGER/Conseiller only)
   * Per assignment: Only advisors can grant loans
   */
  @Post('grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  async grantLoan(
    @Body()
    dto: {
      userId: string;
      accountId: string;
      principal: number;
      annualRate: number;
      termMonths: number;
      insuranceRate: number;
    },
  ) {
    const command = new GrantLoanCommand(
      dto.userId,
      dto.accountId,
      dto.principal,
      dto.annualRate,
      dto.termMonths,
      dto.insuranceRate,
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'Loan granted successfully',
      ...result,
    };
  }

  @Get(':id')
  async getLoan(@Param('id') id: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });

    return loan;
  }

  @Get(':id/schedule')
  async getLoanSchedule(@Param('id') id: string) {
    const schedules = await this.prisma.loanSchedule.findMany({
      where: { loanId: id },
      orderBy: { installmentNumber: 'asc' },
    });

    return schedules;
  }

  @Get('user/:userId')
  async getUserLoans(@Param('userId') userId: string) {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      include: {
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return loans;
  }

  @Post(':id/calculate-payment')
  async calculatePayment(
    @Body()
    dto: {
      principal: number;
      annualRate: number;
      termMonths: number;
      insuranceRate: number;
    },
  ) {
    // Calculate monthly payment using the same formula as the aggregate
    const monthlyRate = dto.annualRate / 12;
    let monthlyPaymentWithoutInsurance: number;

    if (monthlyRate === 0) {
      monthlyPaymentWithoutInsurance = dto.principal / dto.termMonths;
    } else {
      monthlyPaymentWithoutInsurance =
        (dto.principal * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -dto.termMonths));
    }

    const monthlyInsurance = (dto.principal * dto.insuranceRate) / dto.termMonths;
    const totalMonthlyPayment = monthlyPaymentWithoutInsurance + monthlyInsurance;
    const totalAmount = totalMonthlyPayment * dto.termMonths;
    const totalInterest = totalAmount - dto.principal - (monthlyInsurance * dto.termMonths);

    return {
      monthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
      monthlyPaymentWithoutInsurance: Math.round(monthlyPaymentWithoutInsurance * 100) / 100,
      monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalInsurance: Math.round(monthlyInsurance * dto.termMonths * 100) / 100,
    };
  }

  // ==================== LOAN REQUEST WORKFLOW ====================

  /**
   * Client requests a loan
   */
  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestLoan(
    @Request() req,
    @Body()
    dto: {
      accountId: string;
      requestedAmount: number;
      termMonths: number;
      purpose: string;
    },
  ) {
    const command = new RequestLoanCommand(
      req.user.sub, // userId from JWT
      dto.accountId,
      dto.requestedAmount,
      dto.termMonths,
      dto.purpose,
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'Loan request submitted successfully. A manager will review your request soon.',
      ...result,
    };
  }

  /**
   * Get all pending loan requests (MANAGER only)
   */
  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  async getLoanRequests() {
    const requests = await this.prisma.loanRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'ASSIGNED'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  /**
   * Get a specific loan request
   */
  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  async getLoanRequest(@Param('id') id: string) {
    const request = await this.prisma.loanRequest.findUnique({
      where: { id },
    });

    return request;
  }

  /**
   * Manager assigns a loan request to themselves
   */
  @Post('requests/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  async assignLoanRequest(@Request() req, @Param('id') id: string) {
    const command = new AssignLoanRequestCommand(id, req.user.sub);

    const result = await this.commandBus.execute(command);
    return {
      message: 'Loan request assigned successfully. A private conversation has been created with the client.',
      ...result,
    };
  }

  /**
   * Manager approves a loan request
   */
  @Post('requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  async approveLoanRequest(
    @Request() req,
    @Param('id') id: string,
    @Body()
    dto: {
      approvedAmount: number;
      annualRate: number;
      termMonths: number;
      insuranceRate: number;
    },
  ) {
    const command = new ApproveLoanRequestCommand(
      id,
      req.user.sub,
      dto.approvedAmount,
      dto.annualRate,
      dto.termMonths,
      dto.insuranceRate,
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'Loan approved and granted successfully.',
      ...result,
    };
  }

  /**
   * Manager rejects a loan request
   */
  @Post('requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MANAGER')
  async rejectLoanRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { reason: string },
  ) {
    const command = new RejectLoanRequestCommand(id, req.user.sub, dto.reason);

    const result = await this.commandBus.execute(command);
    return {
      message: 'Loan request rejected.',
      ...result,
    };
  }

  /**
   * Get client's own loan requests
   */
  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  async getMyLoanRequests(@Request() req) {
    const requests = await this.prisma.loanRequest.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }
}
