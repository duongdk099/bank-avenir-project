import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { io, Socket } from 'socket.io-client';

describe('New Features E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Test data
  let clientToken: string;
  let clientId: string;
  let confirmationToken: string;
  let advisor1Token: string;
  let advisor1Id: string;
  let advisor2Token: string;
  let advisor2Id: string;
  let conversationId: string;

  // WebSocket clients
  let clientSocket: Socket;
  let advisor1Socket: Socket;
  let advisor2Socket: Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Clean database
    await cleanDatabase();
  });

  afterAll(async () => {
    // Disconnect sockets
    if (clientSocket?.connected) clientSocket.disconnect();
    if (advisor1Socket?.connected) advisor1Socket.disconnect();
    if (advisor2Socket?.connected) advisor2Socket.disconnect();

    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    await prisma.message.deleteMany();
    await prisma.privateConversation.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.loanSchedule.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.order.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.security.deleteMany();
    await prisma.accountOperations.deleteMany();
    await prisma.transfer.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.savingsRate.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  }

  describe('Email Confirmation Feature', () => {
    describe('POST /auth/register with email confirmation', () => {
      it('should register user and return confirmation token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'testuser@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User',
            phone: '+33612345678',
            address: '123 Test St',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
            dateOfBirth: '1990-01-01',
          })
          .expect(201);

        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('confirmationToken');
        expect(response.body.message).toContain('Please check your email');
        
        clientId = response.body.userId;
        confirmationToken = response.body.confirmationToken;
      });

      it('should prevent duplicate email registration', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'testuser@example.com', // Same email
            password: 'Test123!@#',
            firstName: 'Duplicate',
            lastName: 'User',
          })
          .expect(409); // Conflict
      });
    });

    describe('GET /auth/confirm/:token', () => {
      it('should confirm email with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get(`/auth/confirm/${confirmationToken}`)
          .expect(200);

        expect(response.body.message).toBe('Email confirmed successfully');
        expect(response.body.userId).toBe(clientId);
      });

      it('should return already confirmed message on second confirmation', async () => {
        const response = await request(app.getHttpServer())
          .get(`/auth/confirm/${confirmationToken}`)
          .expect(200);

        expect(response.body.message).toBe('Email already confirmed');
      });

      it('should reject invalid token', async () => {
        await request(app.getHttpServer())
          .get('/auth/confirm/invalid-token-123')
          .expect(401); // Unauthorized
      });

      it('should reject expired token format', async () => {
        // This would need a token that's actually expired
        // For now, test with malformed token
        await request(app.getHttpServer())
          .get('/auth/confirm/malformed.token.here')
          .expect(401);
      });
    });

    describe('POST /auth/login after confirmation', () => {
      it('should allow login after email confirmation', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'testuser@example.com',
            password: 'Test123!@#',
          })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.user.email).toBe('testuser@example.com');
        clientToken = response.body.accessToken;
      });
    });
  });

  describe('Conversation Transfer Feature', () => {
    beforeAll(async () => {
      // Create two advisor accounts
      const advisor1Response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'advisor1@bank.com',
          password: 'Advisor123!',
          firstName: 'John',
          lastName: 'Advisor',
          phone: '+33611111111',
        });
      advisor1Id = advisor1Response.body.userId;

      // Update to MANAGER role
      await prisma.user.update({
        where: { id: advisor1Id },
        data: { role: 'MANAGER' },
      });

      const advisor2Response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'advisor2@bank.com',
          password: 'Advisor456!',
          firstName: 'Jane',
          lastName: 'AdvisorTwo',
          phone: '+33622222222',
        });
      advisor2Id = advisor2Response.body.userId;

      // Update to ADMIN role
      await prisma.user.update({
        where: { id: advisor2Id },
        data: { role: 'ADMIN' },
      });

      // Login advisors
      const advisor1Login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'advisor1@bank.com',
          password: 'Advisor123!',
        });
      advisor1Token = advisor1Login.body.accessToken;

      const advisor2Login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'advisor2@bank.com',
          password: 'Advisor456!',
        });
      advisor2Token = advisor2Login.body.accessToken;

      // Create conversation between client and advisor1
      conversationId = await createConversation(clientId, advisor1Id);
    });

    async function createConversation(user1Id: string, user2Id: string): Promise<string> {
      const conversation = await prisma.privateConversation.create({
        data: {
          user1Id,
          user2Id,
        },
      });
      return conversation.id;
    }

    function connectSocket(userId: string, token: string): Promise<Socket> {
      return new Promise((resolve, reject) => {
        const socket = io(`http://localhost:${process.env.PORT || 3000}/chat`, {
          query: { userId },
          auth: { token },
          transports: ['websocket'],
        });

        socket.on('connect', () => resolve(socket));
        socket.on('connect_error', reject);

        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    }

    describe('WebSocket conversation transfer', () => {
      it('should connect advisors to chat', async () => {
        advisor1Socket = await connectSocket(advisor1Id, advisor1Token);
        advisor2Socket = await connectSocket(advisor2Id, advisor2Token);

        expect(advisor1Socket.connected).toBe(true);
        expect(advisor2Socket.connected).toBe(true);
      });

      it('should transfer conversation from advisor1 to advisor2', (done) => {
        // Listen for transfer notification on advisor2
        advisor2Socket.once('conversation_transferred_to_you', (data) => {
          expect(data.conversationId).toBe(conversationId);
          expect(data.clientId).toBe(clientId);
          expect(data.fromAdvisor).toContain('John Advisor');
          done();
        });

        // Advisor1 transfers conversation
        advisor1Socket.emit('transfer_conversation', {
          conversationId,
          newAdvisorId: advisor2Id,
          reason: 'Specialized knowledge required',
        }, (response: any) => {
          expect(response.success).toBe(true);
          expect(response.newAdvisorId).toBe(advisor2Id);
        });
      });

      it('should verify conversation ownership changed in database', async () => {
        const conversation = await prisma.privateConversation.findUnique({
          where: { id: conversationId },
        });

        expect(conversation?.user2Id).toBe(advisor2Id);
      });

      it('should not allow non-owner to transfer conversation', (done) => {
        // Advisor1 tries to transfer again (but no longer owns it)
        advisor1Socket.emit('transfer_conversation', {
          conversationId,
          newAdvisorId: advisor1Id,
          reason: 'Taking back',
        }, (response: any) => {
          expect(response.error).toBe('You are not the owner of this conversation');
          done();
        });
      });

      it('should not allow transfer to non-advisor', (done) => {
        advisor2Socket.emit('transfer_conversation', {
          conversationId,
          newAdvisorId: clientId, // Client, not advisor
          reason: 'Invalid transfer',
        }, (response: any) => {
          expect(response.error).toContain('must have ADMIN or MANAGER role');
          done();
        });
      });

      it('should not allow self-transfer', (done) => {
        advisor2Socket.emit('transfer_conversation', {
          conversationId,
          newAdvisorId: advisor2Id, // Self
          reason: 'Self transfer',
        }, (response: any) => {
          expect(response.error).toBe('Cannot transfer conversation to yourself');
          done();
        });
      });
    });
  });

  describe('Integration: Email Confirmation + Account Creation', () => {
    it('should allow creating account after email confirmation', async () => {
      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          accountType: 'CHECKING',
          name: 'My Checking Account',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accountId');
      expect(response.body).toHaveProperty('iban');
      expect(response.body.accountType).toBe('CHECKING');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should still support existing registration flow', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'legacy@example.com',
          password: 'Legacy123!',
          firstName: 'Legacy',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('confirmationToken');
    });

    it('should still support existing login flow', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'legacy@example.com',
          password: 'Legacy123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });
  });
});
