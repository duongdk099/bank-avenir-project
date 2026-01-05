import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';

/**
 * Comprehensive E2E Tests for AVENIR Bank API
 * Tests all endpoints including authentication, accounts, transfers, 
 * orders, loans, admin functions, and real-time features
 */
describe('AVENIR Bank - Complete API E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  // Test credentials and IDs
  let clientToken: string;
  let client2Token: string;
  let managerToken: string;
  let adminToken: string;
  
  let clientId: string;
  let client2Id: string;
  let managerId: string;
  let adminId: string;
  
  let checkingAccountId: string;
  let savingsAccountId: string;
  let investmentAccountId: string;
  let client2AccountId: string;
  let client2Iban: string;
  
  let securityId: string;
  let securitySymbol: string = 'TESTSTOCK';
  
  let buyOrderId: string;
  let sellOrderId: string;
  
  let loanId: string;
  let conversationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    const tables = [
      'Message',
      'PrivateConversation',
      'Notification',
      'LoanSchedule',
      'Loan',
      'Trade',
      'Order',
      'Portfolio',
      'Security',
      'AccountOperations',
      'Transfer',
      'BankAccount',
      'SavingsRate',
      'UserProfile',
      'Event',
      'User',
    ];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    }
  }

  // ============================================================
  // AUTHENTICATION & USER MANAGEMENT TESTS
  // ============================================================

  describe('1. Authentication', () => {
    describe('POST /auth/register', () => {
      it('should register client user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'client@avenir.com',
            password: 'SecurePass123!',
            firstName: 'Jean',
            lastName: 'Dupont',
            phone: '+33612345678',
            address: '123 Rue de la Paix',
            city: 'Paris',
            postalCode: '75001',
            country: 'France',
            dateOfBirth: '1990-01-15',
          })
          .expect(201);

        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('confirmationToken');
        clientId = response.body.userId;
      });

      it('should register second client', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'client2@avenir.com',
            password: 'SecurePass123!',
            firstName: 'Marie',
            lastName: 'Martin',
            phone: '+33612345679',
            address: '456 Avenue Victor Hugo',
            city: 'Lyon',
            postalCode: '69001',
            country: 'France',
            dateOfBirth: '1992-06-20',
          })
          .expect(201);

        client2Id = response.body.userId;
      });

      it('should register manager user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'manager@avenir.com',
            password: 'ManagerPass123!',
            firstName: 'Pierre',
            lastName: 'Conseiller',
            phone: '+33612345680',
            address: '789 Rue du Commerce',
            city: 'Paris',
            postalCode: '75008',
            country: 'France',
            dateOfBirth: '1985-03-10',
          })
          .expect(201);

        managerId = response.body.userId;
        await prisma.user.update({
          where: { id: managerId },
          data: { role: 'MANAGER', status: 'CONFIRMED' },
        });
      });

      it('should register admin user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'admin@avenir.com',
            password: 'AdminPass123!',
            firstName: 'Director',
            lastName: 'Banque',
            phone: '+33612345681',
            address: '999 Boulevard Haussman',
            city: 'Paris',
            postalCode: '75009',
            country: 'France',
            dateOfBirth: '1980-12-05',
          })
          .expect(201);

        adminId = response.body.userId;
        await prisma.user.update({
          where: { id: adminId },
          data: { role: 'ADMIN', status: 'CONFIRMED' },
        });
      });

      it('should reject duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'client@avenir.com',
            password: 'Password123!',
            firstName: 'Duplicate',
            lastName: 'User',
            phone: '+33612345682',
            address: '111 Street',
            city: 'Paris',
            postalCode: '75010',
            country: 'France',
            dateOfBirth: '1995-01-01',
          })
          .expect(409);
      });
    });

    describe('POST /auth/login', () => {
      it('should login client successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'client@avenir.com',
            password: 'SecurePass123!',
          })
          .expect(200);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user).toHaveProperty('email', 'client@avenir.com');
        clientToken = response.body.access_token;
      });

      it('should login second client', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'client2@avenir.com',
            password: 'SecurePass123!',
          })
          .expect(200);

        client2Token = response.body.access_token;
      });

      it('should login manager', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'manager@avenir.com',
            password: 'ManagerPass123!',
          })
          .expect(200);

        managerToken = response.body.access_token;
      });

      it('should login admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'admin@avenir.com',
            password: 'AdminPass123!',
          })
          .expect(200);

        adminToken = response.body.access_token;
      });

      it('should reject invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'client@avenir.com',
            password: 'WrongPassword',
          })
          .expect(401);
      });
    });
  });

  // ============================================================
  // ACCOUNT MANAGEMENT TESTS
  // ============================================================

  describe('2. Account Management', () => {
    describe('POST /accounts/open', () => {
      it('should open CHECKING account for client', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            userId: clientId,
            accountType: 'CHECKING',
            initialDeposit: 10000,
          })
          .expect(201);

        expect(response.body).toHaveProperty('accountId');
        expect(response.body).toHaveProperty('iban');
        expect(response.body.iban).toMatch(/^FR[0-9]{2}/);
        checkingAccountId = response.body.accountId;
      });

      it('should open SAVINGS account for client', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            userId: clientId,
            accountType: 'SAVINGS',
            initialDeposit: 20000,
          })
          .expect(201);

        savingsAccountId = response.body.accountId;
      });

      it('should open INVESTMENT account for client', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            userId: clientId,
            accountType: 'INVESTMENT',
            initialDeposit: 50000,
          })
          .expect(201);

        investmentAccountId = response.body.accountId;
      });

      it('should open account for second client', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/open')
          .set('Authorization', `Bearer ${client2Token}`)
          .send({
            userId: client2Id,
            accountType: 'CHECKING',
            initialDeposit: 5000,
          })
          .expect(201);

        client2AccountId = response.body.accountId;
        client2Iban = response.body.iban;
      });
    });

    describe('GET /accounts/:id', () => {
      it('should get account details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/accounts/${checkingAccountId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', checkingAccountId);
        expect(response.body).toHaveProperty('balance');
        expect(response.body).toHaveProperty('accountType', 'CHECKING');
      });
    });

    describe('GET /accounts/user/:userId', () => {
      it('should get all user accounts', async () => {
        const response = await request(app.getHttpServer())
          .get(`/accounts/user/${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(3);
      });
    });

    describe('PUT /accounts/:id/rename', () => {
      it('should rename user\'s own account', async () => {
        const response = await request(app.getHttpServer())
          .put(`/accounts/${checkingAccountId}/rename`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            newName: 'My Main Checking',
            userId: clientId,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should reject renaming another user\'s account', async () => {
        await request(app.getHttpServer())
          .put(`/accounts/${client2AccountId}/rename`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            newName: 'Hacked Name',
            userId: clientId,
          })
          .expect(403);
      });
    });
  });

  // ============================================================
  // TRANSFER TESTS
  // ============================================================

  describe('3. Transfers', () => {
    describe('POST /accounts/transfer', () => {
      it('should transfer funds between accounts', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/transfer')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            fromAccountId: checkingAccountId,
            toIban: client2Iban,
            amount: 500,
            description: 'Test transfer',
          })
          .expect(201);

        expect(response.body).toHaveProperty('transferId');
        expect(response.body).toHaveProperty('newBalance');
      });

      it('should reject transfer with insufficient funds', async () => {
        await request(app.getHttpServer())
          .post('/accounts/transfer')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            fromAccountId: checkingAccountId,
            toIban: client2Iban,
            amount: 999999,
            description: 'Insufficient funds test',
          })
          .expect(400);
      });

      it('should reject transfer to non-existent IBAN', async () => {
        await request(app.getHttpServer())
          .post('/accounts/transfer')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            fromAccountId: checkingAccountId,
            toIban: 'FR7699999999999999999999999',
            amount: 100,
          })
          .expect(404);
      });
    });
  });

  // ============================================================
  // ADMIN FUNCTIONS TESTS
  // ============================================================

  describe('4. Admin Functions', () => {
    describe('POST /admin/securities', () => {
      it('should create security as admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/securities')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            symbol: securitySymbol,
            name: 'Test Stock Inc.',
            type: 'STOCK',
            exchange: 'EURONEXT',
            currentPrice: 100.00,
            currency: 'EUR',
          })
          .expect(201);

        expect(response.body.security).toHaveProperty('id');
        securityId = response.body.security.id;
      });

      it('should reject security creation as non-admin', async () => {
        await request(app.getHttpServer())
          .post('/admin/securities')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            symbol: 'FAIL',
            name: 'Should Fail',
            type: 'STOCK',
            currentPrice: 50.00,
          })
          .expect(403);
      });
    });

    describe('GET /admin/securities', () => {
      it('should get all securities as admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/securities')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should get securities as manager', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/securities')
          .set('Authorization', `Bearer ${managerToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });

    describe('POST /admin/savings-rate', () => {
      it('should update savings rate and notify users', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/savings-rate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            accountType: 'SAVINGS',
            rate: 0.035,
            minBalance: 1000,
            effectiveDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .expect(201);

        expect(response.body).toHaveProperty('savingsRate');
        expect(response.body).toHaveProperty('notifiedUsers');
      });
    });

    describe('GET /admin/users', () => {
      it('should get all users as admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('PUT /admin/users/:id/role', () => {
      it('should update user role as admin', async () => {
        const response = await request(app.getHttpServer())
          .put(`/admin/users/${clientId}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'CLIENT' })
          .expect(200);

        expect(response.body.user.role).toBe('CLIENT');
      });
    });

    describe('GET /admin/dashboard', () => {
      it('should get dashboard stats', async () => {
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

    describe('POST /admin/stocks', () => {
      it('should create stock via stocks endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/stocks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            symbol: 'TECH',
            name: 'Tech Corp',
            type: 'STOCK',
            exchange: 'NASDAQ',
            currentPrice: 150.00,
            currency: 'USD',
          })
          .expect(201);

        expect(response.body).toHaveProperty('message');
      });
    });

    describe('PUT /admin/stocks/:symbol/availability', () => {
      it('should update stock availability', async () => {
        const response = await request(app.getHttpServer())
          .put(`/admin/stocks/${securitySymbol}/availability`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ isAvailable: true })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });

  // ============================================================
  // ORDERS & TRADING TESTS
  // ============================================================

  describe('5. Orders & Trading', () => {
    describe('POST /orders', () => {
      it('should place BUY order', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            userId: clientId,
            accountId: investmentAccountId,
            securityId: securityId,
            type: 'BUY',
            quantity: 10,
            price: 100.00,
          })
          .expect(201);

        expect(response.body).toHaveProperty('orderId');
        buyOrderId = response.body.orderId;
      });

      it('should place SELL order', async () => {
        // First give client2 some shares
        await prisma.portfolio.create({
          data: {
            accountId: client2AccountId,
            securityId: securityId,
            quantity: 100,
            averagePrice: 95.00,
          },
        });

        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${client2Token}`)
          .send({
            userId: client2Id,
            accountId: client2AccountId,
            securityId: securityId,
            type: 'SELL',
            quantity: 10,
            price: 100.00,
          })
          .expect(201);

        sellOrderId = response.body.orderId;
      });
    });

    describe('GET /orders/:id', () => {
      it('should get order details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/${buyOrderId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', buyOrderId);
        expect(response.body).toHaveProperty('type', 'BUY');
      });
    });

    describe('GET /orders/user/:userId', () => {
      it('should get user orders', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/user/${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });

    describe('GET /orders/security/:securityId/book', () => {
      it('should get order book', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/security/${securityId}/book`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('buyOrders');
        expect(response.body).toHaveProperty('sellOrders');
      });
    });

    describe('GET /orders/account/:accountId/trades', () => {
      it('should get executed trades', async () => {
        const response = await request(app.getHttpServer())
          .get(`/orders/account/${investmentAccountId}/trades`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });

    describe('DELETE /orders/:id', () => {
      it('should cancel pending order', async () => {
        // Create a new order to cancel
        const orderResponse = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            userId: clientId,
            accountId: investmentAccountId,
            securityId: securityId,
            type: 'BUY',
            quantity: 5,
            price: 95.00,
          })
          .expect(201);

        const response = await request(app.getHttpServer())
          .delete(`/orders/${orderResponse.body.orderId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================================
  // LOANS TESTS
  // ============================================================

  describe('6. Loans', () => {
    describe('POST /loans/grant', () => {
      it('should grant loan as manager', async () => {
        const response = await request(app.getHttpServer())
          .post('/loans/grant')
          .set('Authorization', `Bearer ${managerToken}`)
          .send({
            userId: clientId,
            accountId: checkingAccountId,
            principal: 25000,
            annualRate: 0.055,
            termMonths: 36,
            insuranceRate: 0.01,
          })
          .expect(201);

        expect(response.body).toHaveProperty('loanId');
        expect(response.body).toHaveProperty('monthlyPayment');
        loanId = response.body.loanId;
      });
    });

    describe('GET /loans/:id', () => {
      it('should get loan details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/loans/${loanId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', loanId);
        expect(response.body).toHaveProperty('principal');
      });
    });

    describe('GET /loans/:id/schedule', () => {
      it('should get amortization schedule', async () => {
        const response = await request(app.getHttpServer())
          .get(`/loans/${loanId}/schedule`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBe(36);
      });
    });

    describe('GET /loans/user/:userId', () => {
      it('should get user loans', async () => {
        const response = await request(app.getHttpServer())
          .get(`/loans/user/${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('POST /loans/:id/calculate-payment', () => {
      it('should calculate loan payment preview', async () => {
        const response = await request(app.getHttpServer())
          .post(`/loans/${loanId}/calculate-payment`)
          .set('Authorization', `Bearer ${clientToken}`)
          .send({
            principal: 30000,
            annualRate: 0.06,
            termMonths: 48,
            insuranceRate: 0.015,
          })
          .expect(201);

        expect(response.body).toHaveProperty('monthlyPayment');
        expect(response.body).toHaveProperty('totalPayment');
        expect(response.body).toHaveProperty('totalInterest');
      });
    });
  });

  // ============================================================
  // MESSAGES & NOTIFICATIONS TESTS
  // ============================================================

  describe('7. Messages & Notifications', () => {
    describe('GET /messages/conversations', () => {
      it('should get user conversations', async () => {
        const response = await request(app.getHttpServer())
          .get(`/messages/conversations?userId=${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });

    describe('GET /messages/unread', () => {
      it('should get unread message count', async () => {
        const response = await request(app.getHttpServer())
          .get(`/messages/unread?userId=${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('unreadCount');
      });
    });

    describe('GET /notifications', () => {
      it('should get all notifications', async () => {
        const response = await request(app.getHttpServer())
          .get(`/notifications?userId=${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });

      it('should get only unread notifications', async () => {
        const response = await request(app.getHttpServer())
          .get(`/notifications?userId=${clientId}&unreadOnly=true`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });

    describe('GET /notifications/unread-count', () => {
      it('should get unread notification count', async () => {
        const response = await request(app.getHttpServer())
          .get(`/notifications/unread-count?userId=${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('unreadCount');
      });
    });

    describe('POST /notifications/read-all', () => {
      it('should mark all notifications as read', async () => {
        const response = await request(app.getHttpServer())
          .post(`/notifications/read-all?userId=${clientId}`)
          .set('Authorization', `Bearer ${clientToken}`)
          .expect(201);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================================
  // INTEREST CALCULATION TEST
  // ============================================================

  describe('8. Interest Calculation', () => {
    describe('POST /accounts/interest/calculate', () => {
      it('should calculate interest for savings accounts', async () => {
        const response = await request(app.getHttpServer())
          .post('/accounts/interest/calculate')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(201);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ============================================================
  // ADMIN ACCOUNT MANAGEMENT TESTS
  // ============================================================

  describe('9. Admin Account Management', () => {
    let adminCreatedAccountId: string;

    describe('POST /admin/accounts/create', () => {
      it('should create account for client as admin', async () => {
        const response = await request(app.getHttpServer())
          .post('/admin/accounts/create')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: clientId,
            accountType: 'SAVINGS',
            initialDeposit: 15000,
            name: 'Admin Created Savings',
          })
          .expect(201);

        expect(response.body).toHaveProperty('accountId');
        adminCreatedAccountId = response.body.accountId;
      });
    });

    describe('PUT /admin/accounts-rename/:id', () => {
      it('should rename account as admin', async () => {
        const response = await request(app.getHttpServer())
          .put(`/admin/accounts-rename/${adminCreatedAccountId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            newName: 'Renamed by Admin',
            requestedBy: adminId,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /admin/accounts/:id/ban', () => {
      it('should ban account as admin', async () => {
        const response = await request(app.getHttpServer())
          .put(`/admin/accounts/${adminCreatedAccountId}/ban`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: 'Test ban',
            bannedBy: adminId,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /admin/accounts/:id', () => {
      it('should close account as admin', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/admin/accounts/${adminCreatedAccountId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: 'Test closure',
            closedBy: adminId,
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });
  });
});
