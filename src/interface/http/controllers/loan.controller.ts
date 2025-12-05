import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { GrantLoanCommand } from '../../../application/commands/grant-loan.command.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';

@Controller('loans')
export class LoanController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post('grant')
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
}
