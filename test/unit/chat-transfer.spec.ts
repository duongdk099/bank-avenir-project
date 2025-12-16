import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ChatGateway } from '../../src/interface/websocket/chat.gateway';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';
import { Server, Socket } from 'socket.io';

describe('ChatGateway - Conversation Transfer', () => {
  let gateway: ChatGateway;
  let prismaService: PrismaService;
  let eventBus: EventBus;
  let mockServer: Partial<Server>;
  let mockClient: Partial<Socket>;

  const advisorId = 'advisor-123';
  const newAdvisorId = 'advisor-456';
  const clientId = 'client-789';
  const conversationId = 'conversation-001';

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    privateConversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockClient = {
      id: 'socket-123',
      handshake: { query: { userId: advisorId } } as any,
      join: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    prismaService = module.get<PrismaService>(PrismaService);
    eventBus = module.get<EventBus>(EventBus);

    gateway.server = mockServer as Server;
    gateway['socketUsers'].set('socket-123', advisorId);
    gateway['userSockets'].set(advisorId, mockClient as Socket);
  });

  afterEach(() => {
    jest.clearAllMocks();
    gateway['socketUsers'].clear();
    gateway['userSockets'].clear();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleTransferConversation', () => {
    it('should transfer conversation successfully', async () => {
      // Mock current advisor
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      // Mock conversation
      mockPrismaService.privateConversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: clientId,
        user2Id: advisorId,
        user1: {
          id: clientId,
          profile: { firstName: 'Alice', lastName: 'Client' },
        },
        user2: {
          id: advisorId,
          profile: { firstName: 'John', lastName: 'Advisor' },
        },
      });

      // Mock new advisor
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: newAdvisorId,
        role: 'ADMIN',
        profile: { firstName: 'Jane', lastName: 'NewAdvisor' },
      });

      mockPrismaService.privateConversation.update.mockResolvedValue({});

      const payload = {
        conversationId,
        newAdvisorId,
        reason: 'Specialized support needed',
      };

      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.success).toBe(true);
      expect(result.conversationId).toBe(conversationId);
      expect(result.newAdvisorId).toBe(newAdvisorId);

      expect(mockPrismaService.privateConversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { user2Id: newAdvisorId },
      });

      expect(mockServer.to).toHaveBeenCalledWith(`user:${newAdvisorId}`);
      expect(mockServer.to).toHaveBeenCalledWith(`user:${clientId}`);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should return error if user not authenticated', async () => {
      const unauthorizedClient = { id: 'unknown-socket' } as Socket;

      const payload = { conversationId, newAdvisorId };
      const result = await gateway.handleTransferConversation(unauthorizedClient, payload);

      expect(result.error).toBe('User not authenticated');
    });

    it('should return error if current user is not an advisor', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'CLIENT', // Not an advisor
        profile: { firstName: 'Regular', lastName: 'User' },
      });

      const payload = { conversationId, newAdvisorId };
      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.error).toBe('Only advisors can transfer conversations');
    });

    it('should return error if conversation not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      mockPrismaService.privateConversation.findUnique.mockResolvedValue(null);

      const payload = { conversationId, newAdvisorId };
      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.error).toBe('Conversation not found');
    });

    it('should return error if current advisor does not own conversation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      mockPrismaService.privateConversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: clientId,
        user2Id: 'different-advisor-id', // Not the current advisor
        user1: { id: clientId, profile: { firstName: 'Alice', lastName: 'Client' } },
        user2: { id: 'different-advisor-id', profile: { firstName: 'Other', lastName: 'Advisor' } },
      });

      const payload = { conversationId, newAdvisorId };
      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.error).toBe('You are not the owner of this conversation');
    });

    it('should return error if new advisor not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      mockPrismaService.privateConversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: clientId,
        user2Id: advisorId,
        user1: { id: clientId, profile: { firstName: 'Alice', lastName: 'Client' } },
        user2: { id: advisorId, profile: { firstName: 'John', lastName: 'Advisor' } },
      });

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      const payload = { conversationId, newAdvisorId };
      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.error).toBe('New advisor not found');
    });

    it('should return error if new advisor does not have correct role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      mockPrismaService.privateConversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: clientId,
        user2Id: advisorId,
        user1: { id: clientId, profile: { firstName: 'Alice', lastName: 'Client' } },
        user2: { id: advisorId, profile: { firstName: 'John', lastName: 'Advisor' } },
      });

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: newAdvisorId,
        role: 'CLIENT', // Not an advisor
        profile: { firstName: 'Regular', lastName: 'User' },
      });

      const payload = { conversationId, newAdvisorId };
      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.error).toBe('New advisor must have ADMIN or MANAGER role');
    });

    it('should return error if trying to transfer to self', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId,
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      mockPrismaService.privateConversation.findUnique.mockResolvedValue({
        id: conversationId,
        user1Id: clientId,
        user2Id: advisorId,
        user1: { id: clientId, profile: { firstName: 'Alice', lastName: 'Client' } },
        user2: { id: advisorId, profile: { firstName: 'John', lastName: 'Advisor' } },
      });

      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: advisorId, // Same as current advisor
        role: 'MANAGER',
        profile: { firstName: 'John', lastName: 'Advisor' },
      });

      const payload = { conversationId, newAdvisorId: advisorId };
      const result = await gateway.handleTransferConversation(mockClient as Socket, payload);

      expect(result.error).toBe('Cannot transfer conversation to yourself');
    });
  });
});
