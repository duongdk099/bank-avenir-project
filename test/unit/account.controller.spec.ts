import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AccountController } from '../../src/interface/http/controllers/account.controller.js';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service.js';
import { InterestCalculationService } from '../../src/application/services/interest-calculation.service.js';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('AccountController', () => {
  let controller: AccountController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let prismaService: PrismaService;
  let interestService: InterestCalculationService;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockPrismaService = {
    bankAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    accountOperations: {
      create: jest.fn(),
    },
    transfer: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockInterestService = {
    calculateInterestNow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InterestCalculationService, useValue: mockInterestService },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
    prismaService = module.get<PrismaService>(PrismaService);
    interestService = module.get<InterestCalculationService>(InterestCalculationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('openAccount', () => {
    it('should successfully open a new account', async () => {
      const dto = {
        userId: 'user-123',
        accountType: 'CHECKING',
        initialDeposit: 10000,
      };

      const expectedResult = {
        accountId: 'acc-123',
        iban: 'FR7630001007941234567890185',
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.openAccount(dto);

      expect(result).toEqual({
        message: 'Account opened successfully',
        ...expectedResult,
      });
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('getAccount', () => {
    it('should return account details', async () => {
      const accountId = 'acc-123';
      const mockAccount = {
        id: accountId,
        iban: 'FR7630001007941234567890185',
        balance: 10000,
        accountType: 'CHECKING',
        operations: [],
      };

      mockPrismaService.bankAccount.findUnique.mockResolvedValue(mockAccount);

      const result = await controller.getAccount(accountId);

      expect(result).toEqual(mockAccount);
      expect(prismaService.bankAccount.findUnique).toHaveBeenCalledWith({
        where: { id: accountId },
        include: {
          operations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    });
  });

  describe('getUserAccounts', () => {
    it('should return all accounts for a user', async () => {
      const userId = 'user-123';
      const mockAccounts = [
        {
          id: 'acc-1',
          userId,
          accountType: 'CHECKING',
          balance: 5000,
        },
        {
          id: 'acc-2',
          userId,
          accountType: 'SAVINGS',
          balance: 15000,
        },
      ];

      mockPrismaService.bankAccount.findMany.mockResolvedValue(mockAccounts);

      const result = await controller.getUserAccounts(userId);

      expect(result).toEqual(mockAccounts);
      expect(prismaService.bankAccount.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('transfer', () => {
    const fromAccountId = 'acc-from';
    const toIban = 'FR7630001007941234567890999';
    const amount = 100;

    it('should successfully transfer funds between accounts', async () => {
      const fromAccount = {
        id: fromAccountId,
        iban: 'FR7630001007941234567890185',
        balance: 10000,
        status: 'ACTIVE',
        userId: 'user-123',
      };

      const toAccount = {
        id: 'acc-to',
        iban: toIban,
        balance: 5000,
        status: 'ACTIVE',
        userId: 'user-456',
      };

      mockPrismaService.bankAccount.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);

      const transactionCallback = jest.fn((callback) => 
        callback({
          bankAccount: {
            update: jest.fn()
              .mockResolvedValueOnce({ ...fromAccount, balance: 9900 })
              .mockResolvedValueOnce({ ...toAccount, balance: 5100 }),
          },
          accountOperations: { create: jest.fn() },
          transfer: { create: jest.fn() },
        })
      );

      mockPrismaService.$transaction.mockImplementation(transactionCallback);

      const result = await controller.transfer({
        fromAccountId,
        toIban,
        amount,
        description: 'Test transfer',
      });

      expect(result).toHaveProperty('message', 'Transfer completed successfully');
      expect(result).toHaveProperty('transferId');
      expect(result).toHaveProperty('newBalance');
    });

    it('should throw BadRequestException for negative amount', async () => {
      await expect(
        controller.transfer({
          fromAccountId,
          toIban,
          amount: -100,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if source account not found', async () => {
      mockPrismaService.bankAccount.findUnique.mockResolvedValue(null);

      await expect(
        controller.transfer({ fromAccountId, toIban, amount })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if source account is not active', async () => {
      mockPrismaService.bankAccount.findUnique.mockResolvedValue({
        id: fromAccountId,
        status: 'CLOSED',
        balance: new Decimal(10000),
      });

      await expect(
        controller.transfer({ fromAccountId, toIban, amount })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      const fromAccount = {
        id: fromAccountId,
        iban: 'FR7630001007941234567890185',
        balance: 50,
        status: 'ACTIVE',
      };

      const toAccount = {
        id: 'acc-to',
        iban: toIban,
        balance: 5000,
        status: 'ACTIVE',
      };

      mockPrismaService.bankAccount.findUnique
        .mockResolvedValueOnce(fromAccount)
        .mockResolvedValueOnce(toAccount);

      await expect(
        controller.transfer({ fromAccountId, toIban, amount: 100 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('renameAccount', () => {
    it('should successfully rename user\'s own account', async () => {
      const accountId = 'acc-123';
      const userId = 'user-123';
      const newName = 'My Savings';

      mockPrismaService.bankAccount.findUnique.mockResolvedValue({
        id: accountId,
        userId,
      });

      mockCommandBus.execute.mockResolvedValue({ success: true });

      const result = await controller.renameAccount(accountId, { newName, userId });

      expect(result.success).toBe(true);
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when renaming another user\'s account', async () => {
      const accountId = 'acc-123';
      const userId = 'user-123';
      const differentUserId = 'user-456';

      mockPrismaService.bankAccount.findUnique.mockResolvedValue({
        id: accountId,
        userId: differentUserId,
      });

      await expect(
        controller.renameAccount(accountId, { newName: 'Test', userId })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('calculateInterest', () => {
    it('should calculate interest for all savings accounts', async () => {
      const mockResult = {
        accountsProcessed: 5,
        totalInterestPaid: 125.50,
      };

      mockInterestService.calculateInterestNow.mockResolvedValue(mockResult);

      const result = await controller.calculateInterest();

      expect(result).toEqual({
        message: 'Interest calculation completed',
        ...mockResult,
      });
      expect(interestService.calculateInterestNow).toHaveBeenCalled();
    });
  });
});
