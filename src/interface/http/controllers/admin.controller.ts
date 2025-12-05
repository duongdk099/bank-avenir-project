import { Controller, Post, Put, Body, UseGuards, Get, Param } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard.js';
import { RolesGuard } from '../../../infrastructure/auth/guards/roles.guard.js';
import { Roles } from '../../../infrastructure/auth/decorators/roles.decorator.js';

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
  constructor(private readonly prisma: PrismaService) {}

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
   * Update security price
   */
  @Put('securities/:id/price')
  @Roles('ADMIN', 'MANAGER')
  async updateSecurityPrice(
    @Param('id') id: string,
    @Body() dto: { price: number },
  ) {
    const security = await this.prisma.security.update({
      where: { id },
      data: {
        currentPrice: dto.price,
        lastUpdated: new Date(),
      },
    });

    return {
      message: 'Security price updated',
      security,
    };
  }

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

    // TODO: Publish SAVINGS_RATE_CHANGED event for notifications
    // const event = new SavingsRateChangedEvent(...)
    // this.eventBus.publish(event);

    return {
      message: 'Savings rate updated successfully',
      savingsRate,
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
}
