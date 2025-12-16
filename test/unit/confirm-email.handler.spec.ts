import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfirmEmailHandler } from '../../src/application/use-cases/confirm-email.handler';
import { ConfirmEmailCommand } from '../../src/application/commands/confirm-email.command';
import { EventStore } from '../../src/infrastructure/event-store/event-store.service';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';
import { UserAggregate } from '../../src/domain/entities/user.aggregate';

describe('ConfirmEmailHandler', () => {
  let handler: ConfirmEmailHandler;
  let jwtService: JwtService;
  let eventStore: EventStore;
  let prismaService: PrismaService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockEventStore = {
    getEventsForAggregate: jest.fn(),
    save: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmEmailHandler,
        { provide: JwtService, useValue: mockJwtService },
        { provide: EventStore, useValue: mockEventStore },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    handler = module.get<ConfirmEmailHandler>(ConfirmEmailHandler);
    jwtService = module.get<JwtService>(JwtService);
    eventStore = module.get<EventStore>(EventStore);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const validToken = 'valid-token-123';
    const userId = 'user-123';
    const email = 'test@example.com';

    it('should confirm email successfully', async () => {
      // Mock JWT verification
      mockJwtService.verify.mockReturnValue({
        userId,
        email,
        type: 'email_confirmation',
      });

      // Mock user exists
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email,
        status: 'ACTIVE',
      });

      // Mock event store returns user registered event
      mockEventStore.getEventsForAggregate.mockResolvedValue([
        {
          eventType: 'USER_REGISTERED',
          aggregateId: userId,
          email,
          passwordHash: 'hash',
          role: 'CLIENT',
        },
      ]);

      mockEventStore.save.mockResolvedValue(undefined);

      const command = new ConfirmEmailCommand(validToken);
      const result = await handler.execute(command);

      expect(result).toEqual({
        message: 'Email confirmed successfully',
        userId,
      });
      expect(mockJwtService.verify).toHaveBeenCalledWith(validToken);
      expect(mockEventStore.save).toHaveBeenCalled();
    });

    it('should return already confirmed message if email already confirmed', async () => {
      mockJwtService.verify.mockReturnValue({
        userId,
        email,
        type: 'email_confirmation',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email,
        status: 'ACTIVE',
      });

      // Mock events including confirmation
      mockEventStore.getEventsForAggregate.mockResolvedValue([
        {
          eventType: 'USER_REGISTERED',
          aggregateId: userId,
          email,
          passwordHash: 'hash',
          role: 'CLIENT',
        },
        {
          eventType: 'USER_EMAIL_CONFIRMED',
          aggregateId: userId,
          email,
        },
      ]);

      const command = new ConfirmEmailCommand(validToken);
      const result = await handler.execute(command);

      expect(result.message).toBe('Email already confirmed');
      expect(mockEventStore.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if token type is invalid', async () => {
      mockJwtService.verify.mockReturnValue({
        userId,
        email,
        type: 'wrong_type',
      });

      const command = new ConfirmEmailCommand(validToken);

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow('Invalid confirmation token');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({
        userId,
        email,
        type: 'email_confirmation',
      });

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const command = new ConfirmEmailCommand(validToken);

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(command)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      mockJwtService.verify.mockImplementation(() => {
        throw error;
      });

      const command = new ConfirmEmailCommand('invalid-token');

      await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
      await expect(handler.execute(command)).rejects.toThrow('Invalid confirmation token');
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockJwtService.verify.mockImplementation(() => {
        throw error;
      });

      const command = new ConfirmEmailCommand('expired-token');

      await expect(handler.execute(command)).rejects.toThrow(UnauthorizedException);
      await expect(handler.execute(command)).rejects.toThrow('Confirmation token has expired');
    });
  });
});
