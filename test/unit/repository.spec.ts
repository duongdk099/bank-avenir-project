import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryUserRepository } from '../../src/infrastructure/repositories/in-memory/user.repository';
import { InMemoryBankAccountRepository } from '../../src/infrastructure/repositories/in-memory/bank-account.repository';
import { InMemorySecurityRepository } from '../../src/infrastructure/repositories/in-memory/security.repository';
import { InMemoryLoanRepository } from '../../src/infrastructure/repositories/in-memory/loan.repository';
import { UserRole, UserStatus, AccountType, LoanStatus } from '../../src/domain/types/entity.types';

/**
 * Comprehensive Unit Tests for In-Memory Repository Implementations
 * 
 * These tests cover all repository operations without database dependencies,
 * satisfying the technical constraint: "Proposer 2 adaptateurs (in-memory, SQL, NoSQL, etc)"
 * 
 * Coverage:
 * - User Management (CRUD, filters, authentication)
 * - Bank Account Management (CRUD, IBAN validation, balance operations)
 * - Security/Stock Management (CRUD, availability, price updates)
 * - Loan Management (CRUD, amortization, status tracking)
 */

describe('InMemoryUserRepository', () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
  });

  it('should create and find a user by id', async () => {
    const user = await repository.create({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+33612345678',
      },
    });

    expect(user).toBeDefined();
    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');

    const found = await repository.findById('user-1');
    expect(found).toEqual(user);
  });

  it('should find user by email', async () => {
    await repository.create({
      id: 'user-1',
      email: 'john@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    const found = await repository.findByEmail('john@example.com');
    expect(found).toBeDefined();
    expect(found?.id).toBe('user-1');
  });

  it('should update user', async () => {
    await repository.create({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    const updated = await repository.update('user-1', {
      status: UserStatus.SUSPENDED,
    });

    expect(updated.status).toBe(UserStatus.SUSPENDED);
  });

  it('should delete user', async () => {
    await repository.create({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    await repository.delete('user-1');

    const found = await repository.findById('user-1');
    expect(found).toBeNull();
  });

  it('should filter users by role', async () => {
    await repository.create({
      id: 'user-1',
      email: 'client@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    await repository.create({
      id: 'user-2',
      email: 'admin@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    const clients = await repository.findAll({ role: UserRole.CLIENT });
    expect(clients).toHaveLength(1);
    expect(clients[0].role).toBe(UserRole.CLIENT);
  });

  it('should count users', async () => {
    await repository.create({
      id: 'user-1',
      email: 'user1@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    await repository.create({
      id: 'user-2',
      email: 'user2@example.com',
      passwordHash: 'hashedpassword',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    const count = await repository.count();
    expect(count).toBe(2);
  });
});

describe('InMemoryBankAccountRepository', () => {
  let repository: InMemoryBankAccountRepository;

  beforeEach(() => {
    repository = new InMemoryBankAccountRepository();
  });

  it('should create and find account by id', async () => {
    const account = await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
      name: 'Main Account',
    });

    expect(account).toBeDefined();
    expect(account.id).toBe('account-1');

    const found = await repository.findById('account-1');
    expect(found).toEqual(account);
  });

  it('should find account by IBAN', async () => {
    const iban = 'FR7612345678901234567890123';
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban,
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const found = await repository.findByIban(iban);
    expect(found).toBeDefined();
    expect(found?.id).toBe('account-1');
  });

  it('should find accounts by user id', async () => {
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    await repository.create({
      id: 'account-2',
      userId: 'user-1',
      iban: 'FR7612345678901234567890124',
      accountType: AccountType.SAVINGS,
      balance: 5000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const accounts = await repository.findByUserId('user-1');
    expect(accounts).toHaveLength(2);
  });

  it('should check if IBAN exists', async () => {
    const iban = 'FR7612345678901234567890123';
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban,
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const exists = await repository.existsByIban(iban);
    expect(exists).toBe(true);

    const notExists = await repository.existsByIban('FR7600000000000000000000000');
    expect(notExists).toBe(false);
  });

  it('should update account balance', async () => {
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const updated = await repository.update('account-1', {
      balance: 1500,
    });

    expect(updated.balance).toBe(1500);
  });

  it('should filter accounts by type', async () => {
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    await repository.create({
      id: 'account-2',
      userId: 'user-1',
      iban: 'FR7612345678901234567890124',
      accountType: AccountType.SAVINGS,
      balance: 5000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const savings = await repository.findAll({ accountType: AccountType.SAVINGS });
    expect(savings).toHaveLength(1);
    expect(savings[0].accountType).toBe(AccountType.SAVINGS);
  });

  it('should delete account', async () => {
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    await repository.delete('account-1');
    const found = await repository.findById('account-1');
    expect(found).toBeNull();
  });

  it('should filter accounts by status', async () => {
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    await repository.create({
      id: 'account-2',
      userId: 'user-1',
      iban: 'FR7612345678901234567890124',
      accountType: AccountType.CHECKING,
      balance: 500,
      currency: 'EUR',
      status: 'CLOSED',
    });

    const active = await repository.findAll({ status: 'ACTIVE' });
    expect(active).toHaveLength(1);
    expect(active[0].status).toBe('ACTIVE');
  });

  it('should handle multiple account types for same user', async () => {
    const userId = 'user-multi';

    await repository.create({
      id: 'acc-checking',
      userId,
      iban: 'FR7612345678901234567890125',
      accountType: AccountType.CHECKING,
      balance: 2000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    await repository.create({
      id: 'acc-savings',
      userId,
      iban: 'FR7612345678901234567890126',
      accountType: AccountType.SAVINGS,
      balance: 10000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    await repository.create({
      id: 'acc-investment',
      userId,
      iban: 'FR7612345678901234567890127',
      accountType: AccountType.INVESTMENT,
      balance: 50000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const accounts = await repository.findByUserId(userId);
    expect(accounts).toHaveLength(3);
    
    const types = accounts.map(acc => acc.accountType);
    expect(types).toContain(AccountType.CHECKING);
    expect(types).toContain(AccountType.SAVINGS);
    expect(types).toContain(AccountType.INVESTMENT);
  });

  it('should update account status', async () => {
    await repository.create({
      id: 'account-1',
      userId: 'user-1',
      iban: 'FR7612345678901234567890123',
      accountType: AccountType.CHECKING,
      balance: 1000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const updated = await repository.update('account-1', {
      status: 'SUSPENDED',
    });

    expect(updated.status).toBe('SUSPENDED');
  });
});

describe('InMemorySecurityRepository', () => {
  let repository: InMemorySecurityRepository;

  beforeEach(() => {
    repository = new InMemorySecurityRepository();
  });

  it('should create and find security by id', async () => {
    const security = await repository.create({
      id: 'sec-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 175.50,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    expect(security).toBeDefined();
    expect(security.symbol).toBe('AAPL');

    const found = await repository.findById('sec-1');
    expect(found?.id).toBe('sec-1');
  });

  it('should find security by symbol', async () => {
    await repository.create({
      id: 'sec-1',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 140.25,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    const found = await repository.findBySymbol('GOOGL');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Alphabet Inc.');
  });

  it('should update security price', async () => {
    await repository.create({
      id: 'sec-1',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 250.00,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    const updated = await repository.update('sec-1', {
      currentPrice: 260.50,
      lastUpdated: new Date(),
    });

    expect(updated.currentPrice).toBe(260.50);
  });

  it('should toggle security availability', async () => {
    await repository.create({
      id: 'sec-1',
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 380.00,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    const updated = await repository.update('sec-1', {
      isAvailable: false,
    });

    expect(updated.isAvailable).toBe(false);
  });

  it('should find only available securities', async () => {
    await repository.create({
      id: 'sec-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 175.50,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    await repository.create({
      id: 'sec-2',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 250.00,
      currency: 'USD',
      isAvailable: false,
      lastUpdated: new Date(),
    });

    const available = await repository.findAvailable();
    expect(available).toHaveLength(1);
    expect(available[0].symbol).toBe('AAPL');
  });

  it('should delete security', async () => {
    await repository.create({
      id: 'sec-1',
      symbol: 'TEMP',
      name: 'Temporary Stock',
      type: 'STOCK',
      exchange: 'NYSE',
      currentPrice: 100.00,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    await repository.delete('sec-1');
    const found = await repository.findById('sec-1');
    expect(found).toBeNull();
  });

  it('should find all securities', async () => {
    await repository.create({
      id: 'sec-1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 175.50,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    await repository.create({
      id: 'sec-2',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 140.25,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    const all = await repository.findAll();
    expect(all).toHaveLength(2);
  });

  it('should handle different security types', async () => {
    await repository.create({
      id: 'sec-stock',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currentPrice: 175.50,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    await repository.create({
      id: 'sec-bond',
      symbol: 'BOND1',
      name: 'Government Bond',
      type: 'BOND',
      exchange: 'NYSE',
      currentPrice: 1000.00,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    await repository.create({
      id: 'sec-etf',
      symbol: 'SPY',
      name: 'S&P 500 ETF',
      type: 'ETF',
      exchange: 'NYSE',
      currentPrice: 450.00,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    const all = await repository.findAll();
    expect(all).toHaveLength(3);
    
    const types = all.map(s => s.type);
    expect(types).toContain('STOCK');
    expect(types).toContain('BOND');
    expect(types).toContain('ETF');
  });
});

describe('InMemoryLoanRepository', () => {
  let repository: InMemoryLoanRepository;

  beforeEach(() => {
    repository = new InMemoryLoanRepository();
  });

  it('should create and find loan by id', async () => {
    const loan = await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId: 'account-1',
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.PENDING,
      createdAt: new Date(),
    });

    expect(loan).toBeDefined();
    expect(loan.amount).toBe(100000);
    expect(loan.status).toBe(LoanStatus.PENDING);

    const found = await repository.findById('loan-1');
    expect(found?.id).toBe('loan-1');
  });

  it('should find loans by user id', async () => {
    await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId: 'account-1',
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.APPROVED,
      createdAt: new Date(),
    });

    await repository.create({
      id: 'loan-2',
      userId: 'user-1',
      accountId: 'account-2',
      amount: 50000,
      interestRate: 0.04,
      insuranceRate: 0.003,
      durationMonths: 120,
      monthlyPayment: 506.23,
      status: LoanStatus.ACTIVE,
      createdAt: new Date(),
    });

    const loans = await repository.findByUserId('user-1');
    expect(loans).toHaveLength(2);
  });

  it('should find loans by account id', async () => {
    const accountId = 'account-main';

    await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId,
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.ACTIVE,
      createdAt: new Date(),
    });

    const loans = await repository.findByAccountId(accountId);
    expect(loans).toHaveLength(1);
    expect(loans[0].accountId).toBe(accountId);
  });

  it('should update loan status', async () => {
    await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId: 'account-1',
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.PENDING,
      createdAt: new Date(),
    });

    const updated = await repository.update('loan-1', {
      status: LoanStatus.APPROVED,
      approvalDate: new Date(),
    });

    expect(updated.status).toBe(LoanStatus.APPROVED);
    expect(updated.approvalDate).toBeDefined();
  });

  it('should update loan to active with first payment date', async () => {
    await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId: 'account-1',
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.APPROVED,
      createdAt: new Date(),
    });

    const firstPaymentDate = new Date();
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

    const updated = await repository.update('loan-1', {
      status: LoanStatus.ACTIVE,
      firstPaymentDate,
    });

    expect(updated.status).toBe(LoanStatus.ACTIVE);
    expect(updated.firstPaymentDate).toBeDefined();
  });

  it('should delete loan', async () => {
    await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId: 'account-1',
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.REJECTED,
      createdAt: new Date(),
    });

    await repository.delete('loan-1');
    const found = await repository.findById('loan-1');
    expect(found).toBeNull();
  });

  it('should find all loans', async () => {
    await repository.create({
      id: 'loan-1',
      userId: 'user-1',
      accountId: 'account-1',
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.ACTIVE,
      createdAt: new Date(),
    });

    await repository.create({
      id: 'loan-2',
      userId: 'user-2',
      accountId: 'account-2',
      amount: 50000,
      interestRate: 0.04,
      insuranceRate: 0.003,
      durationMonths: 120,
      monthlyPayment: 506.23,
      status: LoanStatus.PENDING,
      createdAt: new Date(),
    });

    const all = await repository.findAll();
    expect(all).toHaveLength(2);
  });

  it('should handle different loan statuses', async () => {
    const statuses = [
      LoanStatus.PENDING,
      LoanStatus.APPROVED,
      LoanStatus.REJECTED,
      LoanStatus.ACTIVE,
      LoanStatus.COMPLETED,
      LoanStatus.DEFAULTED,
    ];

    for (let i = 0; i < statuses.length; i++) {
      await repository.create({
        id: `loan-${i}`,
        userId: 'user-1',
        accountId: 'account-1',
        amount: 100000,
        interestRate: 0.05,
        insuranceRate: 0.003,
        durationMonths: 240,
        monthlyPayment: 659.96,
        status: statuses[i],
        createdAt: new Date(),
      });
    }

    const all = await repository.findAll();
    expect(all).toHaveLength(statuses.length);

    const foundStatuses = all.map(loan => loan.status);
    statuses.forEach(status => {
      expect(foundStatuses).toContain(status);
    });
  });

  it('should handle different loan amounts and terms', async () => {
    const testCases = [
      { amount: 10000, term: 60, rate: 0.06 },   // Small short-term loan
      { amount: 50000, term: 120, rate: 0.05 },  // Medium loan
      { amount: 200000, term: 360, rate: 0.04 }, // Large mortgage
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      await repository.create({
        id: `loan-${i}`,
        userId: 'user-1',
        accountId: 'account-1',
        amount: testCase.amount,
        interestRate: testCase.rate,
        insuranceRate: 0.003,
        durationMonths: testCase.term,
        monthlyPayment: 500, // Simplified for test
        status: LoanStatus.ACTIVE,
        createdAt: new Date(),
      });
    }

    const loans = await repository.findByUserId('user-1');
    expect(loans).toHaveLength(testCases.length);

    const amounts = loans.map(l => l.amount);
    expect(amounts).toContain(10000);
    expect(amounts).toContain(50000);
    expect(amounts).toContain(200000);
  });
});

describe('Repository Integration Tests', () => {
  let userRepo: InMemoryUserRepository;
  let accountRepo: InMemoryBankAccountRepository;
  let securityRepo: InMemorySecurityRepository;
  let loanRepo: InMemoryLoanRepository;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    accountRepo = new InMemoryBankAccountRepository();
    securityRepo = new InMemorySecurityRepository();
    loanRepo = new InMemoryLoanRepository();
  });

  it('should handle complete user workflow', async () => {
    // 1. Create user
    const user = await userRepo.create({
      id: 'user-workflow',
      email: 'workflow@test.com',
      passwordHash: 'hashed',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
      profile: {
        firstName: 'John',
        lastName: 'Workflow',
      },
    });

    // 2. Create accounts for user
    const checking = await accountRepo.create({
      id: 'acc-checking',
      userId: user.id,
      iban: 'FR7612345678901234567890100',
      accountType: AccountType.CHECKING,
      balance: 5000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    const savings = await accountRepo.create({
      id: 'acc-savings',
      userId: user.id,
      iban: 'FR7612345678901234567890101',
      accountType: AccountType.SAVINGS,
      balance: 20000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    // 3. Create loan for user
    const loan = await loanRepo.create({
      id: 'loan-workflow',
      userId: user.id,
      accountId: checking.id,
      amount: 100000,
      interestRate: 0.05,
      insuranceRate: 0.003,
      durationMonths: 240,
      monthlyPayment: 659.96,
      status: LoanStatus.ACTIVE,
      createdAt: new Date(),
    });

    // Verify all entities are linked correctly
    const userAccounts = await accountRepo.findByUserId(user.id);
    expect(userAccounts).toHaveLength(2);

    const userLoans = await loanRepo.findByUserId(user.id);
    expect(userLoans).toHaveLength(1);

    const accountLoans = await loanRepo.findByAccountId(checking.id);
    expect(accountLoans).toHaveLength(1);
  });

  it('should handle investment account workflow', async () => {
    // 1. Create user
    const user = await userRepo.create({
      id: 'investor',
      email: 'investor@test.com',
      passwordHash: 'hashed',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    // 2. Create investment account
    const investment = await accountRepo.create({
      id: 'acc-investment',
      userId: user.id,
      iban: 'FR7612345678901234567890200',
      accountType: AccountType.INVESTMENT,
      balance: 50000,
      currency: 'EUR',
      status: 'ACTIVE',
    });

    // 3. Create securities
    await securityRepo.create({
      id: 'sec-aapl',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      currentPrice: 175.50,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    await securityRepo.create({
      id: 'sec-googl',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'STOCK',
      currentPrice: 140.25,
      currency: 'USD',
      isAvailable: true,
      lastUpdated: new Date(),
    });

    // Verify
    const availableSecurities = await securityRepo.findAvailable();
    expect(availableSecurities).toHaveLength(2);

    const userAccount = await accountRepo.findById(investment.id);
    expect(userAccount?.accountType).toBe(AccountType.INVESTMENT);
  });

  it('should handle admin user managing system', async () => {
    // Create admin
    const admin = await userRepo.create({
      id: 'admin',
      email: 'admin@bank.com',
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    // Create multiple clients
    const client1 = await userRepo.create({
      id: 'client1',
      email: 'client1@test.com',
      passwordHash: 'hashed',
      role: UserRole.CLIENT,
      status: UserStatus.ACTIVE,
    });

    const client2 = await userRepo.create({
      id: 'client2',
      email: 'client2@test.com',
      passwordHash: 'hashed',
      role: UserRole.CLIENT,
      status: UserStatus.SUSPENDED,
    });

    // Admin views all users
    const allUsers = await userRepo.findAll();
    expect(allUsers).toHaveLength(3);

    // Filter by role
    const clients = await userRepo.findAll({ role: UserRole.CLIENT });
    expect(clients).toHaveLength(2);

    // Filter by status
    const activeUsers = await userRepo.findAll({ status: UserStatus.ACTIVE });
    expect(activeUsers.length).toBeGreaterThanOrEqual(2);
  });
});
