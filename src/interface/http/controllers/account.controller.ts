import { Body, Controller, Post, Get, Param, Put, Delete, UseGuards, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OpenAccountCommand } from '../../../application/commands/open-account.command.js';
import { ClientRenameAccountCommand, ClientDeleteAccountCommand } from '../../../application/commands/client-account.commands.js';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { InterestCalculationService } from '../../../application/services/interest-calculation.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard.js';
import { v4 as uuidv4 } from 'uuid';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
    private readonly interestService: InterestCalculationService,
  ) {}

  /**
   * Transfer funds between accounts (internal transfers only)
   * Per assignment: "effectuer des opérations courantes, tel qu'un transfert d'un compte à un autre 
   * (uniquement au sein de notre banque)"
   */
  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  async transfer(
    @Body()
    dto: {
      fromAccountId: string;
      toIban: string;
      amount: number;
      description?: string;
    },
  ) {
    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Find source account
    const fromAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.fromAccountId },
    });

    if (!fromAccount) {
      throw new NotFoundException('Source account not found');
    }

    if (fromAccount.status !== 'ACTIVE') {
      throw new ForbiddenException('Source account is not active');
    }

    // Find destination account by IBAN (internal transfers only)
    const toAccount = await this.prisma.bankAccount.findUnique({
      where: { iban: dto.toIban },
    });

    if (!toAccount) {
      throw new NotFoundException('Recipient account not found. Only internal transfers within AVENIR bank are permitted.');
    }

    if (toAccount.status !== 'ACTIVE') {
      throw new ForbiddenException('Recipient account is not active');
    }

    // Cannot transfer to same account
    if (fromAccount.id === toAccount.id) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    // Check sufficient funds
    if (fromAccount.balance.toNumber() < dto.amount) {
      throw new BadRequestException(
        `Insufficient funds. Available: €${fromAccount.balance.toNumber().toFixed(2)}, Required: €${dto.amount.toFixed(2)}`
      );
    }

    // Perform transfer in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Debit source account
      const updatedFromAccount = await tx.bankAccount.update({
        where: { id: dto.fromAccountId },
        data: { balance: { decrement: dto.amount } },
      });

      // Credit destination account
      const updatedToAccount = await tx.bankAccount.update({
        where: { id: toAccount.id },
        data: { balance: { increment: dto.amount } },
      });

      const description = dto.description || 'Transfer';
      const transferId = uuidv4();

      // Create debit operation
      await tx.accountOperations.create({
        data: {
          id: uuidv4(),
          accountId: dto.fromAccountId,
          type: 'TRANSFER',
          amount: dto.amount,
          description,
          recipientIban: dto.toIban,
          balanceAfter: updatedFromAccount.balance,
        },
      });

      // Create credit operation
      await tx.accountOperations.create({
        data: {
          id: uuidv4(),
          accountId: toAccount.id,
          type: 'TRANSFER',
          amount: dto.amount,
          description,
          senderIban: fromAccount.iban,
          balanceAfter: updatedToAccount.balance,
        },
      });

      // Create transfer record
      await tx.transfer.create({
        data: {
          id: transferId,
          fromAccountId: dto.fromAccountId,
          toAccountId: toAccount.id,
          amount: dto.amount,
          description,
          reference: `TRF-${Date.now()}`,
          status: 'COMPLETED',
        },
      });

      return {
        transferId,
        fromBalance: updatedFromAccount.balance.toNumber(),
        toBalance: updatedToAccount.balance.toNumber(),
      };
    });

    return {
      message: 'Transfer completed successfully',
      transferId: result.transferId,
      newBalance: result.fromBalance,
    };
  }

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

  /**
   * Client renames their own account
   * Per assignment: "modifier son nom personnalisé si je le souhaite"
   */
  @Put(':id/rename')
  @UseGuards(JwtAuthGuard)
  async renameAccount(
    @Param('id') id: string,
    @Body() dto: { newName: string; userId: string },
  ) {
    // Verify ownership
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.userId !== dto.userId) {
      throw new ForbiddenException('You can only rename your own accounts');
    }

    const command = new ClientRenameAccountCommand(id, dto.newName, dto.userId);
    await this.commandBus.execute(command);

    return {
      success: true,
      message: 'Account renamed successfully',
    };
  }

  /**
   * Client deletes their own account
   * Per assignment: "Je dois pouvoir supprimer le compte"
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @Param('id') id: string,
    @Body() dto: { userId: string; reason?: string },
  ) {
    // Verify ownership
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.userId !== dto.userId) {
      throw new ForbiddenException('You can only delete your own accounts');
    }

    // Check if balance is zero
    if (account.balance.toNumber() !== 0) {
      throw new ForbiddenException('Account must have zero balance before deletion. Please withdraw or transfer all funds.');
    }

    const command = new ClientDeleteAccountCommand(id, dto.userId, dto.reason || 'Client requested deletion');
    await this.commandBus.execute(command);

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }
}
