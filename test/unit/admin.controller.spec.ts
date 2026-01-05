import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { AdminController } from '../../src/interface/http/controllers/admin.controller.js';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service.js';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AdminController', () => {
  let controller: AdminController;
  let commandBus: CommandBus;
  let eventBus: EventBus;
  let prismaService: PrismaService;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  const mockPrismaService = {
    security: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    savingsRate: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    bankAccount: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
    loan: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: EventBus, useValue: mockEventBus },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    commandBus = module.get<CommandBus>(CommandBus);
    eventBus = module.get<EventBus>(EventBus);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSecurity', () => {
    it('should successfully create a new security', async () => {
      const securityDto = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'STOCK',
        exchange: 'NASDAQ',
        currentPrice: 180.50,
        currency: 'USD',
      };

      const mockSecurity = {
        id: 'sec-123',
        ...securityDto,
        symbol: 'AAPL',
        lastUpdated: new Date(),
      };

      mockPrismaService.security.create.mockResolvedValue(mockSecurity);

      const result = await controller.createSecurity(securityDto);

      expect(result).toEqual({
        message: 'Security created successfully',
        security: mockSecurity,
      });
      expect(prismaService.security.create).toHaveBeenCalled();
    });
  });

  describe('getAllSecurities', () => {
    it('should return all securities', async () => {
      const mockSecurities = [
        { id: 'sec-1', symbol: 'AAPL', name: 'Apple Inc.' },
        { id: 'sec-2', symbol: 'GOOGL', name: 'Alphabet Inc.' },
      ];

      mockPrismaService.security.findMany.mockResolvedValue(mockSecurities);

      const result = await controller.getAllSecurities();

      expect(result).toEqual(mockSecurities);
      expect(prismaService.security.findMany).toHaveBeenCalledWith({
        orderBy: { symbol: 'asc' },
      });
    });
  });

  describe('updateSavingsRate', () => {
    it('should update savings rate and notify users', async () => {
      const rateDto = {
        accountType: 'SAVINGS',
        rate: 0.035,
        minBalance: 1000,
        effectiveDate: '2026-02-01',
      };

      const mockSavingsRate = {
        id: 'rate-123',
        ...rateDto,
        effectiveDate: new Date(rateDto.effectiveDate),
      };

      const mockSavingsAccounts = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ];

      mockPrismaService.savingsRate.create.mockResolvedValue(mockSavingsRate);
      mockPrismaService.bankAccount.findMany.mockResolvedValue(mockSavingsAccounts);
      mockPrismaService.notification.create.mockResolvedValue({});

      const result = await controller.updateSavingsRate(rateDto);

      expect(result).toEqual({
        message: 'Savings rate updated successfully',
        savingsRate: mockSavingsRate,
        notifiedUsers: 3,
      });
      expect(eventBus.publish).toHaveBeenCalled();
      expect(prismaService.notification.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSavingsRates', () => {
    it('should return recent savings rates', async () => {
      const mockRates = [
        { id: 'rate-1', rate: 0.035, effectiveDate: new Date() },
        { id: 'rate-2', rate: 0.030, effectiveDate: new Date() },
      ];

      mockPrismaService.savingsRate.findMany.mockResolvedValue(mockRates);

      const result = await controller.getSavingsRates();

      expect(result).toEqual(mockRates);
      expect(prismaService.savingsRate.findMany).toHaveBeenCalledWith({
        orderBy: { effectiveDate: 'desc' },
        take: 10,
      });
    });
  });

  describe('updateUserRole', () => {
    it('should successfully update user role', async () => {
      const userId = 'user-123';
      const newRole = 'MANAGER';

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        role: newRole,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await controller.updateUserRole(userId, { role: newRole });

      expect(result).toEqual({
        message: 'User role updated',
        user: mockUser,
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: newRole },
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with their accounts', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'CLIENT',
          status: 'ACTIVE',
          profile: { firstName: 'John', lastName: 'Doe' },
          accounts: [
            { id: 'acc-1', accountType: 'CHECKING', balance: 5000 },
          ],
          createdAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('accountsCount');
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      mockPrismaService.user.count.mockResolvedValue(100);
      mockPrismaService.bankAccount.count
        .mockResolvedValueOnce(250)
        .mockResolvedValueOnce(250);
      mockPrismaService.order.count
        .mockResolvedValueOnce(500)
        .mockResolvedValueOnce(50);
      mockPrismaService.loan.count
        .mockResolvedValueOnce(75)
        .mockResolvedValueOnce(60);
      mockPrismaService.bankAccount.aggregate.mockResolvedValue({
        _sum: { balance: 5000000 },
      });

      const result = await controller.getDashboardStats();

      expect(result).toEqual({
        users: { total: 100 },
        accounts: { total: 250, totalBalance: 5000000 },
        orders: { total: 500, pending: 50 },
        loans: { total: 75, active: 60 },
      });
    });
  });

  describe('createStock', () => {
    it('should successfully create a new stock', async () => {
      const stockDto = {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        type: 'STOCK',
        exchange: 'NASDAQ',
        currentPrice: 250.00,
        currency: 'USD',
      };

      mockPrismaService.security.findUnique.mockResolvedValue(null);
      mockCommandBus.execute.mockResolvedValue({ success: true, stockId: 'stock-123' });

      const result = await controller.createStock(stockDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('success');
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should throw ConflictException if stock already exists', async () => {
      const stockDto = {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        type: 'STOCK',
        currentPrice: 250.00,
      };

      mockPrismaService.security.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(controller.createStock(stockDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateStockAvailability', () => {
    it('should update stock availability', async () => {
      const symbol = 'TSLA';
      mockPrismaService.security.findUnique.mockResolvedValue({ id: 'stock-123', symbol });
      mockCommandBus.execute.mockResolvedValue({ success: true });

      const result = await controller.updateStockAvailability(symbol, { isAvailable: false });

      expect(result.success).toBe(true);
      expect(result.message).toContain('unavailable');
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should throw NotFoundException if stock does not exist', async () => {
      mockPrismaService.security.findUnique.mockResolvedValue(null);

      await expect(
        controller.updateStockAvailability('INVALID', { isAvailable: true })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStock', () => {
    it('should successfully delete a stock', async () => {
      const symbol = 'TSLA';
      mockPrismaService.security.findUnique.mockResolvedValue({ id: 'stock-123', symbol });
      mockCommandBus.execute.mockResolvedValue({ success: true });

      const result = await controller.deleteStock(symbol);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('createAccountForClient', () => {
    it('should create account for client as admin', async () => {
      const accountDto = {
        userId: 'user-123',
        accountType: 'SAVINGS',
        initialDeposit: 5000,
        name: 'Admin Created Account',
      };

      const expectedResult = {
        accountId: 'acc-123',
        iban: 'FR7630001007941234567890185',
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.createAccountForClient(accountDto);

      expect(result).toEqual({
        message: 'Account created successfully',
        ...expectedResult,
      });
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('banAccount', () => {
    it('should successfully ban an account', async () => {
      const accountId = 'acc-123';
      const banDto = {
        reason: 'Suspicious activity',
        bannedBy: 'admin-123',
      };

      mockCommandBus.execute.mockResolvedValue({ success: true });

      const result = await controller.banAccount(accountId, banDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account banned successfully');
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('closeAccount', () => {
    it('should successfully close an account', async () => {
      const accountId = 'acc-123';
      const closeDto = {
        reason: 'Account closure requested',
        closedBy: 'admin-123',
      };

      mockCommandBus.execute.mockResolvedValue({ success: true });

      const result = await controller.closeAccount(accountId, closeDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account closed successfully');
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });
});
