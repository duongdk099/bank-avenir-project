import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { LoanController } from '../../src/interface/http/controllers/loan.controller.js';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service.js';

describe('LoanController', () => {
  let controller: LoanController;
  let commandBus: CommandBus;
  let prismaService: PrismaService;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockPrismaService = {
    loan: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoanController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<LoanController>(LoanController);
    commandBus = module.get<CommandBus>(CommandBus);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('grantLoan', () => {
    const loanDto = {
      userId: 'user-123',
      accountId: 'acc-123',
      principal: 25000,
      annualRate: 0.055,
      termMonths: 36,
      insuranceRate: 0.01,
    };

    it('should successfully grant a loan', async () => {
      const expectedResult = {
        loanId: 'loan-123',
        monthlyPayment: 758.33,
        totalPayment: 27300,
        totalInterest: 2300,
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.grantLoan(loanDto);

      expect(result).toEqual({
        message: 'Loan granted successfully',
        ...expectedResult,
      });
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should handle loan with insurance', async () => {
      const loanWithInsurance = {
        ...loanDto,
        insuranceRate: 0.02,
      };

      const expectedResult = {
        loanId: 'loan-124',
        monthlyPayment: 775.00,
        totalPayment: 27900,
        totalInterest: 2900,
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.grantLoan(loanWithInsurance);

      expect(result).toHaveProperty('loanId');
      expect(result).toHaveProperty('monthlyPayment');
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('getLoan', () => {
    it('should return loan details', async () => {
      const loanId = 'loan-123';
      const mockLoan = {
        id: loanId,
        userId: 'user-123',
        accountId: 'acc-123',
        principal: 25000,
        annualRate: 0.055,
        termMonths: 36,
        monthlyPayment: 758.33,
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      mockPrismaService.loan.findUnique.mockResolvedValue(mockLoan);

      const result = await controller.getLoan(loanId);

      expect(result).toEqual(mockLoan);
      expect(prismaService.loan.findUnique).toHaveBeenCalledWith({
        where: { id: loanId },
      });
    });
  });

  describe('getAmortizationSchedule', () => {
    it('should return complete amortization schedule', async () => {
      const loanId = 'loan-123';
      const mockSchedule = [
        {
          month: 1,
          payment: 758.33,
          principal: 642.91,
          interest: 115.42,
          balance: 24357.09,
        },
        {
          month: 2,
          payment: 758.33,
          principal: 645.87,
          interest: 112.46,
          balance: 23711.22,
        },
      ];

      mockCommandBus.execute.mockResolvedValue(mockSchedule);

      const result = await controller.getAmortizationSchedule(loanId);

      expect(result).toEqual(mockSchedule);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('payment');
      expect(result[0]).toHaveProperty('principal');
      expect(result[0]).toHaveProperty('interest');
      expect(result[0]).toHaveProperty('balance');
    });
  });

  describe('getUserLoans', () => {
    it('should return all loans for a user', async () => {
      const userId = 'user-123';
      const mockLoans = [
        {
          id: 'loan-1',
          userId,
          principal: 25000,
          status: 'ACTIVE',
          termMonths: 36,
        },
        {
          id: 'loan-2',
          userId,
          principal: 50000,
          status: 'ACTIVE',
          termMonths: 60,
        },
      ];

      mockPrismaService.loan.findMany.mockResolvedValue(mockLoans);

      const result = await controller.getUserLoans(userId);

      expect(result).toEqual(mockLoans);
      expect(prismaService.loan.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('calculatePayment', () => {
    it('should calculate loan payment without creating loan', async () => {
      const loanId = 'loan-123';
      const calcDto = {
        principal: 30000,
        annualRate: 0.06,
        termMonths: 48,
        insuranceRate: 0.015,
      };

      const expectedResult = {
        monthlyPayment: 705.75,
        totalPayment: 33876,
        totalInterest: 3876,
        totalInsurance: 450,
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.calculatePayment(loanId, calcDto);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should calculate payment without insurance', async () => {
      const loanId = 'loan-123';
      const calcDto = {
        principal: 20000,
        annualRate: 0.05,
        termMonths: 24,
        insuranceRate: 0,
      };

      const expectedResult = {
        monthlyPayment: 877.43,
        totalPayment: 21058.32,
        totalInterest: 1058.32,
        totalInsurance: 0,
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.calculatePayment(loanId, calcDto);

      expect(result.totalInsurance).toBe(0);
      expect(result).toHaveProperty('monthlyPayment');
    });
  });
});
