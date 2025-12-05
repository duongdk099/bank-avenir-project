# Banking Core Implementation Summary

## Overview
Implemented the core banking logic with Event Sourcing and CQRS architecture, including IBAN generation using the Modulo 97 algorithm and daily interest calculation for savings accounts.

## Implementation Details

### 1. Value Objects

#### IBAN Value Object (`src/domain/value-objects/iban.vo.ts`)
- **Modulo 97 Algorithm**: Implements the exact ISO 13616 specification for IBAN generation and validation
- **Format**: French IBAN with 27 characters (FR + 2 check digits + 23 BBAN)
- **AVENIR Bank Code**: 12345 (5 digits)
- **Branch Code**: 67890 (5 digits)
- **Account Number**: 11 digits (padded with zeros)
- **RIB Key**: 2 digits
- **Validation**: Full checksum validation using character rearrangement and modulo 97 calculation
- **Methods**:
  - `generate()`: Creates valid IBAN with automatic check digit calculation
  - `validate()`: Validates IBAN using Modulo 97
  - `getFormatted()`: Returns IBAN with spaces for readability

#### Money Value Object (`src/domain/value-objects/money.vo.ts`)
- Immutable value object for monetary amounts
- Currency-aware operations (all operations check currency match)
- Prevents negative amounts
- Arithmetic operations: add, subtract, multiply, divide
- Comparison operations: isGreaterThan, isLessThan, equals
- Automatic rounding to 2 decimal places

### 2. Domain Events

Created 6 banking domain events:
1. **AccountOpenedEvent**: Account creation with IBAN, type, and initial balance
2. **FundsDepositedEvent**: Money deposited into account
3. **FundsWithdrawnEvent**: Money withdrawn from account
4. **TransferSentEvent**: Transfer sent to another account (internal only)
5. **TransferReceivedEvent**: Transfer received from another account
6. **InterestAppliedEvent**: Daily interest applied to savings account

### 3. Bank Account Aggregate

**File**: `src/domain/entities/bank-account.aggregate.ts`

**Business Rules Enforced**:
- Only active accounts can perform operations
- Withdrawals/transfers require sufficient balance
- **Internal transfers only**: Only IBANs starting with FR12345 (AVENIR bank code) are allowed
- Interest only applies to SAVINGS accounts
- Savings accounts have 2% annual interest rate by default

**Methods**:
- `open()`: Factory method to create new account
- `deposit()`: Add funds to account
- `withdraw()`: Remove funds (checks balance)
- `sendTransfer()`: Send internal transfer (validates IBAN and balance)
- `receiveTransfer()`: Receive transfer
- `applyInterest()`: Calculate and apply daily interest (balance × rate / 365)

### 4. IBAN Service

**File**: `src/infrastructure/services/iban.service.ts`

- Generates unique IBANs using sequential account numbering
- Validates IBANs using the Modulo 97 algorithm
- Checks database for IBAN uniqueness
- Identifies internal vs external IBANs

### 5. Use Cases

#### OpenAccountCommand (`src/application/use-cases/open-account.handler.ts`)
- Validates user exists
- Validates account type (CHECKING, SAVINGS, INVESTMENT)
- Generates unique IBAN
- Creates aggregate and saves events to event store
- Returns accountId and formatted IBAN

### 6. Read Model Projectors

**File**: `src/application/event-handlers/account-projector.ts`

**Event Handlers** (updates Prisma read model):
1. `AccountOpenedHandler`: Creates bank_accounts record, creates initial operation if deposit > 0
2. `FundsDepositedHandler`: Updates balance, creates DEPOSIT operation
3. `FundsWithdrawnHandler`: Updates balance, creates WITHDRAWAL operation
4. `TransferSentHandler`: Updates sender balance, creates TRANSFER operation with recipientIban
5. `TransferReceivedHandler`: Updates recipient balance, creates TRANSFER operation with senderIban
6. `InterestAppliedHandler`: Updates balance, creates DEPOSIT operation with interest description

### 7. Daily Interest Calculation Service

**File**: `src/application/services/interest-calculation.service.ts`

**Features**:
- Scheduled cron job running daily at midnight (`@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`)
- Finds all active SAVINGS accounts
- For each account:
  - Loads aggregate from event store
  - Calls `applyInterest()` (formula: balance × rate / 365)
  - Saves INTEREST_APPLIED event
  - Event handler automatically updates read model
- Comprehensive error logging
- Manual trigger method for testing: `calculateInterestNow()`

**Formula**: `interest = balance * (annual_rate / 365)`
- Example: €1000 balance at 2% = €0.05479 daily interest

### 8. Database Schema Updates

**Prisma Schema Changes**:
```prisma
model BankAccount {
  id              String      @id @default(uuid())
  userId          String      @map("user_id")
  iban            String      @unique          // NEW: Replaces accountNumber
  accountType     AccountType @map("account_type")
  balance         Decimal     @default(0)
  currency        String      @default("EUR")
  status          String      @default("ACTIVE") // NEW: Replaces isActive
  ...
}

model AccountOperations {  // NEW: Replaces Operation
  id              String        @id
  accountId       String        @map("account_id")
  type            OperationType
  amount          Decimal
  description     String?
  senderIban      String?       @map("sender_iban")     // NEW
  recipientIban   String?       @map("recipient_iban")  // NEW
  balanceAfter    Decimal       @map("balance_after")
  createdAt       DateTime
  ...
}
```

### 9. API Endpoints

**File**: `src/interface/http/controllers/account.controller.ts`

- `POST /accounts/open`: Open new account
- `GET /accounts/:id`: Get account details with recent operations
- `GET /accounts/user/:userId`: Get all accounts for a user
- `POST /accounts/interest/calculate`: Manual trigger for interest calculation

## Architecture Compliance

✅ **Write Side (Command)**:
- Commands → Handlers → Aggregates → Events → Event Store
- Business logic in aggregates
- No direct database writes from handlers

✅ **Read Side (Query)**:
- Event Handlers (Projectors) listen to events
- Update Prisma read model tables
- Queries read from Prisma

✅ **Separation of Concerns**:
- Domain logic in aggregates (no infrastructure dependencies)
- Value objects enforce business rules
- Services handle infrastructure concerns
- Projectors handle read model updates

## Testing Results

**Successful Test**:
1. User registered: ✅
2. Account opened with valid IBAN: ✅ `FR58 1234 5678 9000 0000 0000 100`
3. Initial deposit recorded: ✅ Balance = 1000 EUR
4. Account type: ✅ SAVINGS
5. Account status: ✅ ACTIVE
6. Operation recorded: ✅ 1 operation

## IBAN Validation Example

Generated IBAN: `FR58 1234 5678 9000 0000 0000 100`
- FR: Country code
- 58: Check digits (calculated via Modulo 97)
- 12345: Bank code (AVENIR)
- 67890: Branch code
- 00000000001: Account number (11 digits)
- 00: RIB key

**Validation Steps**:
1. Rearrange: `12345678900000000000100FR58`
2. Convert letters: F=15, R=27 → `123456789000000000001001527`
3. Calculate Modulo 97: Result = 1 ✅ (valid)

## Files Created/Modified

**New Files**:
- `src/domain/value-objects/iban.vo.ts`
- `src/domain/value-objects/money.vo.ts`
- `src/domain/entities/bank-account.aggregate.ts`
- `src/domain/entities/events/account-opened.event.ts`
- `src/domain/entities/events/funds-deposited.event.ts`
- `src/domain/entities/events/funds-withdrawn.event.ts`
- `src/domain/entities/events/transfer-sent.event.ts`
- `src/domain/entities/events/transfer-received.event.ts`
- `src/domain/entities/events/interest-applied.event.ts`
- `src/infrastructure/services/iban.service.ts`
- `src/application/commands/open-account.command.ts`
- `src/application/use-cases/open-account.handler.ts`
- `src/application/event-handlers/account-projector.ts`
- `src/application/services/interest-calculation.service.ts`
- `src/application/account.module.ts`
- `src/interface/http/controllers/account.controller.ts`

**Modified Files**:
- `src/app.module.ts` (added AccountModule)
- `prisma/schema.prisma` (added iban, status fields, renamed tables)
- `src/domain/entities/aggregate-root.ts` (fixed version initialization)

## Next Steps

To complete the banking implementation, consider adding:
1. Transfer command and handler (to orchestrate sendTransfer + receiveTransfer)
2. Deposit and withdrawal commands
3. Account closure logic
4. Transaction history queries
5. Authentication guards on endpoints
6. Input validation DTOs
7. Integration tests for the complete flow
