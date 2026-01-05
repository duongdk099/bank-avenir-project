import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { OrderController } from '../../src/interface/http/controllers/order.controller.js';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrderController', () => {
  let controller: OrderController;
  let commandBus: CommandBus;
  let prismaService: PrismaService;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    trade: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    commandBus = module.get<CommandBus>(CommandBus);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('placeOrder', () => {
    const orderDto = {
      userId: 'user-123',
      accountId: 'acc-123',
      securityId: 'sec-123',
      type: 'BUY',
      quantity: 10,
      price: 180.50,
    };

    it('should successfully place a buy order', async () => {
      const expectedResult = {
        orderId: 'order-123',
        status: 'PENDING',
        message: 'Order placed successfully',
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.placeOrder(orderDto);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should successfully place a sell order', async () => {
      const sellOrder = { ...orderDto, type: 'SELL' };
      const expectedResult = {
        orderId: 'order-124',
        status: 'PENDING',
        message: 'Order placed successfully',
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.placeOrder(sellOrder);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('should return order details', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        userId: 'user-123',
        securityId: 'sec-123',
        type: 'BUY',
        quantity: 10,
        price: 180.50,
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await controller.getOrder(orderId);

      expect(result).toEqual(mockOrder);
      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: orderId },
        include: {
          security: true,
          trades: true,
        },
      });
    });

    it('should return null if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      const result = await controller.getOrder('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    it('should return all orders for a user', async () => {
      const userId = 'user-123';
      const mockOrders = [
        {
          id: 'order-1',
          userId,
          type: 'BUY',
          status: 'EXECUTED',
          quantity: 5,
          price: 100,
        },
        {
          id: 'order-2',
          userId,
          type: 'SELL',
          status: 'PENDING',
          quantity: 3,
          price: 150,
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await controller.getUserOrders(userId);

      expect(result).toEqual(mockOrders);
      expect(prismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { security: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getOrderBook', () => {
    it('should return order book with buy and sell orders', async () => {
      const securityId = 'sec-123';
      const mockBuyOrders = [
        { id: 'order-1', type: 'BUY', price: 180, quantity: 10 },
        { id: 'order-2', type: 'BUY', price: 179, quantity: 5 },
      ];
      const mockSellOrders = [
        { id: 'order-3', type: 'SELL', price: 181, quantity: 8 },
        { id: 'order-4', type: 'SELL', price: 182, quantity: 12 },
      ];

      mockPrismaService.order.findMany
        .mockResolvedValueOnce(mockBuyOrders)
        .mockResolvedValueOnce(mockSellOrders);

      const result = await controller.getOrderBook(securityId);

      expect(result).toEqual({
        buyOrders: mockBuyOrders,
        sellOrders: mockSellOrders,
      });
      expect(prismaService.order.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('getExecutedTrades', () => {
    it('should return all executed trades for an account', async () => {
      const accountId = 'acc-123';
      const mockTrades = [
        {
          id: 'trade-1',
          buyOrderId: 'order-1',
          sellOrderId: 'order-2',
          price: 180,
          quantity: 10,
          executedAt: new Date(),
        },
      ];

      mockPrismaService.trade.findMany.mockResolvedValue(mockTrades);

      const result = await controller.getExecutedTrades(accountId);

      expect(result).toEqual(mockTrades);
    });
  });

  describe('cancelOrder', () => {
    it('should successfully cancel a pending order', async () => {
      const orderId = 'order-123';
      const expectedResult = {
        message: 'Order cancelled successfully',
        orderId,
      };

      mockCommandBus.execute.mockResolvedValue(expectedResult);

      const result = await controller.cancelOrder(orderId);

      expect(result).toEqual(expectedResult);
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should handle cancellation of non-existent order', async () => {
      mockCommandBus.execute.mockRejectedValue(new NotFoundException('Order not found'));

      await expect(controller.cancelOrder('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
