import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OpenAccountCommand } from '../../../application/commands/open-account.command.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { InterestCalculationService } from '../../../application/services/interest-calculation.service.js';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
    private readonly interestService: InterestCalculationService,
  ) {}

  @Post('open')
  async openAccount(
    @Body()
    dto: {
      userId: string;
      accountType: string;
      initialDeposit?: number;
    },
  ) {
    const command = new OpenAccountCommand(
      dto.userId,
      dto.accountType,
      dto.initialDeposit,
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'Account opened successfully',
      ...result,
    };
  }

  @Get(':id')
  async getAccount(@Param('id') id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
      include: {
        operations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return account;
  }

  @Get('user/:userId')
  async getUserAccounts(@Param('userId') userId: string) {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { userId },
    });

    return accounts;
  }

  @Post('interest/calculate')
  async calculateInterest() {
    const result = await this.interestService.calculateInterestNow();
    return {
      message: 'Interest calculation completed',
      ...result,
    };
  }
}
