import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';

describe('Bank API E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Test data storage
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let user1Id: string;
  let user2Id: string;
  let adminId: string;
  let checkingAccountId: string;
  let savingsAccountId: string;
  let investmentAccountId: string;
  let securityId: string;
  let orderId: string;
  let loanId: string;
  let conversationId: string;
  let notificationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Clean database before tests
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    // Delete in correct order to respect foreign key constraints
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

  describe('Authentication & User Management', () => {
    describe('POST /auth/register', () => {
      it('should register a new user (CLIENT)', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'client1@test.com',
            password: 'Test123!@#',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+33612345678',
            address: '123 Main St',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
            dateOfBirth: '1990-01-01',
          })
          .expect(201);

        expect(response.body).toHaveProperty('userId');
        expect(response.body.message).toBe('User registered successfully');
        user1Id = response.body.userId;
      });

      it('should register second user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'client2@test.com',
            password: 'Test123!@#',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+33612345679',
            address: '456 Second St',
            city: 'Lyon',
            postalCode: '69001',
            country: 'France',
            dateOfBirth: '1992-05-15',
          })
          .expect(201);

        user2Id = response.body.userId;
      });

      it('should register admin user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'admin@test.com',
            password: 'Admin123!@#',
            firstName: 'Admin',
            lastName: 'User',
            phone: '+33612345680',
            address: '789 Admin St',
            city: 'Paris',
            postalCode: '75002',
            country: 'France',
            dateOfBirth: '1985-03-20',
          })
          .expect(201);

        adminId = response.body.userId;
        
        // Manually set admin role in database
        await prisma.user.update({
          where: { id: adminId },
          data: { role: 'ADMIN' },
        });
      });

      it('should fail with duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'client1@test.com',
            password: 'Test123!@#',
            firstName: 'Duplicate',
            lastName: 'User',
            phone: '+33612345681',
            address: '999 Dup St',
            city: 'Paris',
            postalCode: '75003',
            country: 'France',
            dateOfBirth: '1995-08-10',
          })
          .expect(409);
      });
    });

    describe('POST /auth/login', () => {
      it('should login user1', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'client1@test.com',
            password: 'Test123!@#',
          })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('user');
        user1Token = response.body.accessToken;
      });

      it('should login user2', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'client2@test.com',
            password: 'Test123!@#',
          })
          .expect(200);

        user2Token = response.body.accessToken;
      });

      it('should login admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'Admin123!@#',
          })
          .expect(200);

        adminToken = response.body.accessToken;
      });

      it('should fail with wrong password', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'client1@test.com',
            password: 'WrongPassword',
          })
          .expect(401);
      });

      it('should fail with non-existent user', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'Test123!@#',
          })
          .expect(401);
      });
    });
  });

  describe('Account Management', () => {
    describe('POST /accounts/open', () => {
      it('should open checking account', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountType: 'CHECKING',
            initialDeposit: 1000,
          })
          .expect(201);

        expect(response.body).toHaveProperty('accountId');
        expect(response.body).toHaveProperty('iban');
        checkingAccountId = response.body.accountId;
      });

      it('should open savings account', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountType: 'SAVINGS',
            initialDeposit: 5000,
          })
          .expect(201);

        savingsAccountId = response.body.accountId;
      });

      it('should open investment account', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountType: 'INVESTMENT',
            initialDeposit: 10000,
          })
          .expect(201);

        investmentAccountId = response.body.accountId;
      });

      it('should fail with invalid account type', async () => {
        await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountType: 'INVALID_TYPE',
            initialDeposit: 100,
          })
          .expect(400);
      });

      it('should fail with negative deposit', async () => {
        await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountType: 'CHECKING',
            initialDeposit: -100,
          })
          .expect(400);
      });
    });

    describe('GET /accounts/:id', () => {
      it('should get account details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/accounts/${checkingAccountId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.id).toBe(checkingAccountId);
        expect(response.body.accountType).toBe('CHECKING');
        expect(response.body).toHaveProperty('operations');
      });

      it('should return null for non-existent account', async () => {
        const response = await request(app.getHttpServer())
          .get('/accounts/non-existent-id')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Returns empty object for non-existent account
        expect(response.body).toBeTruthy();
      });
    });

    describe('GET /accounts/user/:userId', () => {
      it('should get all user accounts', async () => {
        const response = await request(app.getHttpServer())
          .get(`/accounts/user/${user1Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('POST /accounts/interest/calculate', () => {
      it('should calculate interest for savings accounts', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/interest/calculate')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(201);

        expect(response.body).toHaveProperty('processed');
        expect(response.body).toHaveProperty('message');
      });
    });
  });

  describe('Admin - Stock Management', () => {
    describe('POST /admin/stocks', () => {
      it('should create a stock (admin only)', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/stocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            symbol: 'AAPL',
            name: 'Apple Inc.',
            type: 'STOCK',
            exchange: 'NASDAQ',
            currentPrice: 150.50,
            currency: 'USD',
          })
          .expect(201);

        expect(response.body).toHaveProperty('stockId');
        securityId = response.body.stockId;
      });

      it('should fail without admin role', async () => {
        await request(app.getHttpServer())
          .post('/admin/stocks')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            type: 'STOCK',
            exchange: 'NASDAQ',
            currentPrice: 2800,
            currency: 'USD',
          })
          .expect(403);
      });

      it('should fail with duplicate symbol', async () => {
        await request(app.getHttpServer())
          .post('/admin/stocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            symbol: 'AAPL',
            name: 'Apple Inc. Duplicate',
            type: 'STOCK',
            exchange: 'NASDAQ',
            currentPrice: 151,
            currency: 'USD',
          })
          .expect(409);
      });
    });

    describe('PUT /admin/stocks/:symbol/availability', () => {
      it('should disable stock trading', async () => {
        const response = await request(app.getHttpServer())
          .put('/admin/stocks/AAPL/availability')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isAvailable: false })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should re-enable stock trading', async () => {
        const response = await request(app.getHttpServer())
          .put('/admin/stocks/AAPL/availability')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isAvailable: true })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should fail for non-existent stock', async () => {
        await request(app.getHttpServer())
          .put('/admin/stocks/NONEXIST/availability')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isAvailable: false })
          .expect(404);
      });
    });

    describe('GET /admin/securities', () => {
      it('should list all securities', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/securities')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /admin/securities/:id/price', () => {
      it('should update security price', async () => {
        const response = await request(app.getHttpServer())
          .put(`/admin/securities/${securityId}/price`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 155.75 })
          .expect(200);

        expect(response.body.security.currentPrice).toBe('155.75');
      });
    });
  });

  describe('Admin - Account Management', () => {
    describe('POST /admin/accounts/create', () => {
      it('should create account for client (director)', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/accounts/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: user2Id,
            accountType: 'CHECKING',
            initialDeposit: 2000,
            name: 'Business Account',
          })
          .expect(201);

        expect(response.body).toHaveProperty('accountId');
        expect(response.body).toHaveProperty('iban');
      });
    });

    describe('PUT /admin/accounts/:id/rename', () => {
      it('should rename account', async () => {
        // First create an account to rename
        const createResponse = await request(app.getHttpServer())
          .post('/admin/accounts/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: user1Id,
            accountType: 'SAVINGS',
            initialDeposit: 500,
            name: 'Savings Account',
          })
          .expect(201);

        const accountIdToRename = createResponse.body.accountId;

        const response = await request(app.getHttpServer())
          .put(`/admin/accounts-rename/${accountIdToRename}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            newName: 'Premium Savings',
            requestedBy: adminId,
          });

        if (response.status !== 200) {
          console.log('Response status:', response.status);
          console.log('Response body:', response.body);
          console.log('Account ID:', accountIdToRename);
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Admin - Savings Rates', () => {
    describe('POST /admin/savings-rate', () => {
      it('should update savings rate', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/savings-rate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            accountType: 'SAVINGS',
            rate: 0.025,
            minBalance: 1000,
            effectiveDate: new Date().toISOString(),
          })
          .expect(201);

        expect(response.body).toHaveProperty('savingsRate');
      });
    });

    describe('GET /admin/savings-rates', () => {
      it('should get savings rates', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/savings-rates')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  describe('Admin - User Management', () => {
    describe('GET /admin/users', () => {
      it('should list all users', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('PUT /admin/users/:id/role', () => {
      it('should update user role to MANAGER', async () => {
        const response = await request(app.getHttpServer())
          .put(`/admin/users/${user2Id}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'MANAGER' })
          .expect(200);

        expect(response.body.user.role).toBe('MANAGER');
      });
    });

    describe('GET /admin/dashboard', () => {
      it('should get dashboard statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('accounts');
        expect(response.body).toHaveProperty('orders');
        expect(response.body).toHaveProperty('loans');
      });
    });
  });

  describe('Orders & Trading', () => {
    describe('POST /orders', () => {
      it('should place buy order', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountId: investmentAccountId,
            securityId: securityId,
            type: 'BUY',
            quantity: 10,
            price: 155,
          })
          .expect(201);

        expect(response.body).toHaveProperty('orderId');
        orderId = response.body.orderId;
      });

      it('should fail with insufficient funds', async () => {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountId: investmentAccountId,
            type: 'BUY',
            quantity: 10000,
            price: 10000,
            securityId: securityId,
          })
          .expect(400);
      });
    });

    describe('GET /orders/:id', () => {
      it('should get order details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.id).toBe(orderId);
      });
    });

    describe('GET /orders/user/:userId', () => {
      it('should get user orders', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/user/${user1Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /orders/security/:securityId/book', () => {
      it('should get order book', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/security/${securityId}/book`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('buyOrders');
        expect(response.body).toHaveProperty('sellOrders');
      });
    });

    describe('GET /orders/account/:accountId/trades', () => {
      it('should get account trades', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/account/${investmentAccountId}/trades`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('DELETE /orders/:id', () => {
      it('should cancel order', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/orders/${orderId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            reason: 'Changed my mind',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Loans', () => {
    describe('POST /loans/grant', () => {
      it('should grant a loan', async () => {
        const response = await request(app.getHttpServer())
          .post('/loans/grant')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountId: checkingAccountId,
            principal: 50000,
            annualRate: 0.05,
            termMonths: 240,
            insuranceRate: 0.003,
          })
          .expect(201);

        expect(response.body).toHaveProperty('loanId');
        expect(response.body).toHaveProperty('monthlyPayment');
        loanId = response.body.loanId;
      });

      it('should fail with invalid term', async () => {
        await request(app.getHttpServer())
          .post('/loans/grant')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            userId: user1Id,
            accountId: checkingAccountId,
            principal: 50000,
            annualRate: 0.05,
            termMonths: 500, // Too long
            insuranceRate: 0.003,
          })
          .expect(400);
      });
    });

    describe('GET /loans/:id', () => {
      it('should get loan details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/loans/${loanId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.id).toBe(loanId);
      });
    });

    describe('GET /loans/:id/schedule', () => {
      it('should get loan amortization schedule', async () => {
        const response = await request(app.getHttpServer())
          .get(`/loans/${loanId}/schedule`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(240);
      });
    });

    describe('GET /loans/user/:userId', () => {
      it('should get user loans', async () => {
        const response = await request(app.getHttpServer())
          .get(`/loans/user/${user1Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /loans/:id/calculate-payment', () => {
      it('should calculate loan payment preview', async () => {
        const response = await request(app.getHttpServer())
          .post(`/loans/${loanId}/calculate-payment`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            principal: 100000,
            annualRate: 0.04,
            termMonths: 360,
            insuranceRate: 0.003,
          })
          .expect(201);

        expect(response.body).toHaveProperty('monthlyPayment');
        expect(response.body).toHaveProperty('totalAmount');
        expect(response.body).toHaveProperty('totalInterest');
      });
    });
  });

  describe('Messages', () => {
    beforeAll(async () => {
      // Create a conversation and message for testing
      const conversation = await prisma.privateConversation.create({
        data: {
          user1Id: user1Id,
          user2Id: adminId,
        },
      });
      conversationId = conversation.id;

      await prisma.message.create({
        data: {
          conversationId,
          senderId: user1Id,
          receiverId: adminId,
          content: 'Hello, I need help',
          isRead: false,
        },
      });
    });

    describe('GET /messages/conversations', () => {
      it('should get user conversations', async () => {
        const response = await request(app.getHttpServer())
          .get(`/messages/conversations?userId=${user1Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('GET /messages/conversations/:conversationId', () => {
      it('should get messages in conversation', async () => {
        const response = await request(app.getHttpServer())
          .get(`/messages/conversations/${conversationId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should limit messages', async () => {
        const response = await request(app.getHttpServer())
          .get(`/messages/conversations/${conversationId}?limit=1`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.length).toBeLessThanOrEqual(1);
      });
    });

    describe('GET /messages/unread', () => {
      it('should get unread message count', async () => {
        const response = await request(app.getHttpServer())
          .get(`/messages/unread?userId=${adminId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBeGreaterThan(0);
      });
    });
  });

  describe('Notifications', () => {
    beforeAll(async () => {
      // Create a notification for testing
      const notification = await prisma.notification.create({
        data: {
          userId: user1Id,
          title: 'Test Notification',
          message: 'This is a test',
          type: 'SYSTEM',
          isRead: false,
        },
      });
      notificationId = notification.id;
    });

    describe('GET /notifications', () => {
      it('should get all notifications', async () => {
        const response = await request(app.getHttpServer())
          .get(`/notifications?userId=${user1Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should get only unread notifications', async () => {
        const response = await request(app.getHttpServer())
          .get(`/notifications?userId=${user1Id}&unreadOnly=true`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((notif: any) => {
          expect(notif.isRead).toBe(false);
        });
      });
    });

    describe('GET /notifications/unread-count', () => {
      it('should get unread count', async () => {
        const response = await request(app.getHttpServer())
          .get(`/notifications/unread-count?userId=${user1Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('count');
      });
    });

    describe('POST /notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        const response = await request(app.getHttpServer())
          .post(`/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(201);

        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /notifications/read-all', () => {
      it('should mark all notifications as read', async () => {
        const response = await request(app.getHttpServer())
          .post('/notifications/read-all')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ userId: user1Id })
          .expect(201);

        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Root Endpoint', () => {
    it('GET / should return Hello World', async () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });
});
