-- ============================================
-- Bank Project - Test Data Seed Script
-- ============================================
-- This script creates test users, accounts, securities,
-- and initial portfolio data for comprehensive testing
-- ============================================

-- NOTE: Run this AFTER your application has created the schema
-- Use Prisma Studio (npx prisma studio) or pgAdmin to execute

-- ============================================
-- 1. TEST USERS
-- ============================================

-- Client User
-- Email: test.client@bank.com
-- Password: Test123! (bcrypt hash below)
INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'client-test-001',
  'test.client@bank.com',
  '$2b$10$YourBcryptHashHere', -- Replace with actual bcrypt hash of 'Test123!'
  'CLIENT',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Manager User
INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'manager-test-001',
  'test.manager@bank.com',
  '$2b$10$YourBcryptHashHere', -- Replace with actual bcrypt hash of 'Test123!'
  'MANAGER',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Admin User
INSERT INTO users (id, email, password_hash, role, status, created_at, updated_at)
VALUES (
  'admin-test-001',
  'test.admin@bank.com',
  '$2b$10$YourBcryptHashHere', -- Replace with actual bcrypt hash of 'Test123!'
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. USER PROFILES
-- ============================================

INSERT INTO user_profiles (id, user_id, first_name, last_name, phone, address, city, postal_code, country, date_of_birth, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'client-test-001', 'Test', 'Client', '+1234567890', '123 Test St', 'Test City', '12345', 'USA', '1990-01-01', NOW(), NOW()),
  (gen_random_uuid(), 'manager-test-001', 'Test', 'Manager', '+1234567891', '456 Manager Ave', 'Test City', '12345', 'USA', '1985-05-15', NOW(), NOW()),
  (gen_random_uuid(), 'admin-test-001', 'Test', 'Admin', '+1234567892', '789 Admin Blvd', 'Test City', '12345', 'USA', '1980-12-25', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. BANK ACCOUNTS
-- ============================================

-- Client Checking Account
INSERT INTO bank_accounts (id, user_id, iban, account_type, balance, reserved, currency, status, created_at, updated_at)
VALUES (
  'account-checking-001',
  'client-test-001',
  'FR7630006000011234567890189',
  'CHECKING',
  25000.00,
  0.00,
  'USD',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Client Savings Account
INSERT INTO bank_accounts (id, user_id, iban, account_type, balance, reserved, currency, status, created_at, updated_at)
VALUES (
  'account-savings-001',
  'client-test-001',
  'FR7630006000011234567890190',
  'SAVINGS',
  100000.00,
  0.00,
  'USD',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Manager Account (for matching orders)
INSERT INTO bank_accounts (id, user_id, iban, account_type, balance, reserved, currency, status, created_at, updated_at)
VALUES (
  'account-manager-001',
  'manager-test-001',
  'FR7630006000011234567890191',
  'CHECKING',
  500000.00,
  0.00,
  'USD',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. SECURITIES
-- ============================================

INSERT INTO securities (id, symbol, name, type, exchange, current_price, currency, last_updated, created_at, updated_at)
VALUES 
  ('security-aapl', 'AAPL', 'Apple Inc.', 'STOCK', 'NASDAQ', 180.50, 'USD', NOW(), NOW(), NOW()),
  ('security-tsla', 'TSLA', 'Tesla Inc.', 'STOCK', 'NASDAQ', 250.00, 'USD', NOW(), NOW(), NOW()),
  ('security-googl', 'GOOGL', 'Alphabet Inc.', 'STOCK', 'NASDAQ', 140.25, 'USD', NOW(), NOW(), NOW()),
  ('security-msft', 'MSFT', 'Microsoft Corporation', 'STOCK', 'NASDAQ', 380.00, 'USD', NOW(), NOW(), NOW()),
  ('security-amzn', 'AMZN', 'Amazon.com Inc.', 'STOCK', 'NASDAQ', 155.75, 'USD', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. INITIAL PORTFOLIO (For Testing SELL Orders)
-- ============================================

-- Give client some initial stocks to test selling
INSERT INTO portfolios (id, account_id, security_id, quantity, avg_purchase_price, total_cost, updated_at)
VALUES 
  (gen_random_uuid(), 'account-checking-001', 'security-aapl', 50, 175.00, 8750.00, NOW()),
  (gen_random_uuid(), 'account-checking-001', 'security-tsla', 20, 240.00, 4800.00, NOW()),
  (gen_random_uuid(), 'account-checking-001', 'security-msft', 30, 375.00, 11250.00, NOW())
ON CONFLICT DO NOTHING;

-- Give manager securities for matching orders
INSERT INTO portfolios (id, account_id, security_id, quantity, avg_purchase_price, total_cost, updated_at)
VALUES 
  (gen_random_uuid(), 'account-manager-001', 'security-aapl', 1000, 170.00, 170000.00, NOW()),
  (gen_random_uuid(), 'account-manager-001', 'security-tsla', 500, 230.00, 115000.00, NOW()),
  (gen_random_uuid(), 'account-manager-001', 'security-googl', 800, 135.00, 108000.00, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SAVINGS RATES
-- ============================================

INSERT INTO savings_rates (id, account_type, rate, min_balance, effective_date, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'SAVINGS', 0.035, 1000.00, '2024-01-01', NOW(), NOW()),
  (gen_random_uuid(), 'SAVINGS', 0.045, 50000.00, '2024-01-01', NOW(), NOW()),
  (gen_random_uuid(), 'CHECKING', 0.005, 0.00, '2024-01-01', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. SAMPLE EVENTS (Optional - for event sourcing)
-- ============================================

-- Account Opened Event
INSERT INTO events (id, aggregate_id, aggregate_type, event_type, event_data, version, created_at)
VALUES (
  gen_random_uuid(),
  'account-checking-001',
  'Account',
  'ACCOUNT_OPENED',
  jsonb_build_object(
    'accountId', 'account-checking-001',
    'userId', 'client-test-001',
    'accountType', 'CHECKING',
    'iban', 'FR7630006000011234567890189',
    'initialDeposit', 25000.00
  ),
  1,
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check created users
-- SELECT id, email, role, status FROM users WHERE email LIKE 'test.%@bank.com';

-- Check accounts
-- SELECT id, user_id, account_type, balance, iban FROM bank_accounts WHERE user_id LIKE '%-test-%';

-- Check securities
-- SELECT id, symbol, name, current_price FROM securities;

-- Check portfolios
-- SELECT p.id, u.email, s.symbol, p.quantity, p.avg_purchase_price, p.total_cost
-- FROM portfolios p
-- JOIN bank_accounts ba ON p.account_id = ba.id
-- JOIN users u ON ba.user_id = u.id
-- JOIN securities s ON p.security_id = s.id;

-- ============================================
-- NOTES
-- ============================================

/*
1. PASSWORD HASHING:
   To generate bcrypt hash for 'Test123!':
   
   Node.js:
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash('Test123!', 10);
   console.log(hash);
   
   Or use online tool: https://bcrypt-generator.com/
   (Use 10 rounds)

2. USING THIS SCRIPT:
   
   Method 1 - Prisma Studio:
   - Run: npx prisma studio
   - Open Raw Query tab
   - Paste and execute sections

   Method 2 - psql:
   psql -U your_user -d your_database -f seed.sql

   Method 3 - pgAdmin:
   - Connect to database
   - Open Query Tool
   - Paste and execute

3. TEST CREDENTIALS:
   Client:  test.client@bank.com  / Test123!
   Manager: test.manager@bank.com / Test123!
   Admin:   test.admin@bank.com   / Test123!

4. TEST ACCOUNTS:
   Client has:
   - Checking: $25,000 + 50 AAPL + 20 TSLA + 30 MSFT
   - Savings: $100,000
   
   Manager has:
   - Checking: $500,000 + 1000 AAPL + 500 TSLA + 800 GOOGL

5. READY FOR TESTING:
   - BUY orders: Client has sufficient funds
   - SELL orders: Client has securities to sell
   - Order matching: Manager can fill orders
   - Loans: Client qualifies for loans
   - Interest: Savings account eligible
*/
