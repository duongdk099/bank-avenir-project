import { Controller, Post, Put, Body, UseGuards, Get, Param, Delete, ConflictException, NotFoundException } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';
import { 
  CreateStockCommand, 
  UpdateStockAvailabilityCommand, 
  DeleteStockCommand 
} from '../../../application/commands/manage-stock.commands.js';
import { 
  DirectorCreateAccountCommand, 
  RenameAccountCommand, 
  BanAccountCommand, 
  CloseAccountCommand 
} from '../../../application/commands/account-management.commands.js';
import { SavingsRateChangedEvent } from '../../../domain/entities/events/savings-rate-changed.event.js';

/**
 * Admin Controller
 * 
 * Handles administrative operations:
 * - Creating securities
 * - Updating savings rates
 * - Managing user roles
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Create a new security (DIRECTOR only)
   */
  @Post('securities')
  @Roles('ADMIN')
  async createSecurity(
    @Body()
    dto: {
      symbol: string;
      name: string;
      type: string;
      exchange?: string;
      currentPrice: number;
      currency?: string;
    },
  ) {
    const security = await this.prisma.security.create({
      data: {
        symbol: dto.symbol.toUpperCase(),
        name: dto.name,
        type: dto.type,
        exchange: dto.exchange,
        currentPrice: dto.currentPrice,
        currency: dto.currency || 'EUR',
        lastUpdated: new Date(),
      },
    });

    return {
      message: 'Security created successfully',
      security,
    };
  }

  /**
   * NOTE: Stock price update endpoint REMOVED per assignment requirement
   * "Je n'ai pas la possibilité de modifier le cours d'une action"
   * Stock prices are determined by the order matching engine (supply & demand)
   */

  /**
   * Get all securities
   */
  @Get('securities')
  @Roles('ADMIN', 'MANAGER')
  async getAllSecurities() {
    return await this.prisma.security.findMany({
      orderBy: { symbol: 'asc' },
    });
  }

  /**
   * Update savings interest rate (DIRECTOR only)
   * Per assignment: "tous les clients ayant actuellement un compte d'épargne 
   * doivent avoir une notification en ce qui concerne le changement du taux"
   */
  @Post('savings-rate')
  @Roles('ADMIN')
  async updateSavingsRate(
    @Body()
    dto: {
      accountType: string;
      rate: number;
      minBalance: number;
      effectiveDate: string;
    },
  ) {
    const savingsRate = await this.prisma.savingsRate.create({
      data: {
        accountType: dto.accountType,
        rate: dto.rate,
        minBalance: dto.minBalance,
        effectiveDate: new Date(dto.effectiveDate),
      },
    });

    // Notify all clients with savings accounts about the rate change
    const savingsAccounts = await this.prisma.bankAccount.findMany({
      where: { accountType: 'SAVINGS' },
      select: { userId: true },
      distinct: ['userId'],
    });

    const ratePercentage = (dto.rate * 100).toFixed(2);
    
    // Create notifications for all affected users
    const notificationPromises = savingsAccounts.map(account =>
      this.prisma.notification.create({
        data: {
          userId: account.userId,
          title: 'Taux d\'épargne modifié',
          message: `Le nouveau taux d'épargne est de ${ratePercentage}%. Ce taux prend effet à partir du ${new Date(dto.effectiveDate).toLocaleDateString('fr-FR')}.`,
          type: 'SAVINGS_RATE_CHANGED',
        },
      })
    );

    await Promise.all(notificationPromises);

    // Publish event for SSE/WebSocket real-time notifications
    this.eventBus.publish(new SavingsRateChangedEvent(
      dto.accountType,
      0, // Old rate not tracked, set to 0
      dto.rate,
      dto.minBalance,
      new Date(dto.effectiveDate),
    ));

    return {
      message: 'Savings rate updated successfully',
      savingsRate,
      notifiedUsers: savingsAccounts.length,
    };
  }

  /**
   * Get current savings rates
   */
  @Get('savings-rates')
  @Roles('ADMIN', 'MANAGER')
  async getSavingsRates() {
    return await this.prisma.savingsRate.findMany({
      orderBy: { effectiveDate: 'desc' },
      take: 10,
    });
  }

  /**
   * Update user role (DIRECTOR only)
   */
  @Put('users/:id/role')
  @Roles('ADMIN')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: { role: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role as any },
    });

    return {
      message: 'User role updated',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Get all users (for admin management)
   */
  @Get('users')
  @Roles('ADMIN', 'MANAGER')
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
        accounts: {
          select: {
            id: true,
            iban: true,
            accountType: true,
            balance: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
      accountsCount: user.accounts.length,
      accounts: user.accounts,
      createdAt: user.createdAt,
    }));
  }

  /**
   * Get dashboard statistics
   */
  @Get('dashboard')
  @Roles('ADMIN', 'MANAGER')
  async getDashboardStats() {
    const [
      totalUsers,
      totalAccounts,
      totalOrders,
      totalLoans,
      pendingOrders,
      activeLoans,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.bankAccount.count(),
      this.prisma.order.count(),
      this.prisma.loan.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.loan.count({ where: { status: 'ACTIVE' } }),
    ]);

    // Get total deposits across all accounts
    const accountsSum = await this.prisma.bankAccount.aggregate({
      _sum: { balance: true },
    });

    return {
      users: {
        total: totalUsers,
      },
      accounts: {
        total: totalAccounts,
        totalBalance: accountsSum._sum.balance || 0,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
      },
      loans: {
        total: totalLoans,
        active: activeLoans,
      },
    };
  }

  // ==================== Stock Management ====================

  /**
   * Create a new stock (Admin only)
   */
  @Post('stocks')
  @Roles('ADMIN')
  async createStock(
    @Body()
    dto: {
      symbol: string;
      name: string;
      type: string;
      exchange?: string;
      currentPrice: number;
      currency?: string;
    },
  ) {
    // Check if stock already exists
    const existing = await this.prisma.security.findUnique({
      where: { symbol: dto.symbol.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Stock with symbol ${dto.symbol} already exists`);
    }

    const command = new CreateStockCommand(
      dto.symbol,
      dto.name,
      dto.type,
      dto.exchange,
      dto.currentPrice,
      dto.currency || 'USD',
    );

    const result = await this.commandBus.execute(command);

    return {
      message: 'Stock created successfully',
      ...result,
    };
  }

  /**
   * Update stock availability (Admin only)
   */
  @Put('stocks/:symbol/availability')
  @Roles('ADMIN')
  async updateStockAvailability(
    @Param('symbol') symbol: string,
    @Body() dto: { isAvailable: boolean },
  ) {
    // Check if stock exists
    const stock = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with symbol ${symbol} not found`);
    }

    const command = new UpdateStockAvailabilityCommand(symbol, dto.isAvailable);
    await this.commandBus.execute(command);

    return {
      success: true,
      message: `Stock ${symbol} is now ${dto.isAvailable ? 'available' : 'unavailable'} for trading`,
    };
  }

  /**
   * Delete stock (Admin only)
   */
  @Delete('stocks/:symbol')
  @Roles('ADMIN')
  async deleteStock(@Param('symbol') symbol: string) {
    // Check if stock exists
    const stock = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException(`Stock with symbol ${symbol} not found`);
    }

    const command = new DeleteStockCommand(symbol);
    await this.commandBus.execute(command);

    return {
      success: true,
      message: `Stock ${symbol} deleted successfully`,
    };
  }

  // ==================== Account Management (Director) ====================

  /**
   * Create account for client (Director only)
   */
  @Post('accounts/create')
  @Roles('ADMIN')
  async createAccountForClient(
    @Body()
    dto: {
      userId: string;
      accountType: string;
      initialDeposit: number;
      name?: string;
    },
  ) {
    const command = new DirectorCreateAccountCommand(
      dto.userId,
      dto.accountType,
      dto.initialDeposit,
      dto.name,
    );

    const result = await this.commandBus.execute(command);

    return {
      message: 'Account created successfully',
      accountId: result.accountId,
      iban: result.iban,
    };
  }

  /**
   * Rename account (Director only)
   */
  @Put('accounts-rename/:id')
  @Roles('ADMIN')
  async renameAccount(
    @Param('id') id: string,
    @Body() dto: { newName: string; requestedBy: string },
  ) {
    const command = new RenameAccountCommand(id, dto.newName, dto.requestedBy);
    await this.commandBus.execute(command);

    return {
      success: true,
      message: 'Account renamed successfully',
    };
  }

  /**
   * Ban account (Director only)
   */
  @Put('accounts/:id/ban')
  @Roles('ADMIN')
  async banAccount(
    @Param('id') id: string,
    @Body() dto: { reason: string; bannedBy: string },
  ) {
    const command = new BanAccountCommand(id, dto.reason, dto.bannedBy);
    await this.commandBus.execute(command);

    return {
      success: true,
      message: 'Account banned successfully',
    };
  }

  /**
   * Close account (Director only)
   */
  @Delete('accounts/:id')
  @Roles('ADMIN')
  async closeAccount(
    @Param('id') id: string,
    @Body() dto: { reason: string; closedBy: string },
  ) {
    const command = new CloseAccountCommand(id, dto.reason, dto.closedBy);
    await this.commandBus.execute(command);

    return {
      success: true,
      message: 'Account closed successfully',
    };
  }
}
