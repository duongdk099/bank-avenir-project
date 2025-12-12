# AVENIR Banking - Repository Pattern Implementation

## Overview

This document describes the implementation of the **Repository Pattern** with **in-memory adapters** to satisfy the technical constraint:

> **"Proposer 2 adaptateurs (in-memory, SQL, NoSQL, etc) pour les bases de données"**

## Architecture

### Clean Architecture Compliance

```
┌─────────────────────────────────────────────────┐
│                 Domain Layer                     │
│  ┌───────────────────────────────────────────┐  │
│  │   Repository Interfaces (Contracts)       │  │
│  │   - IUserRepository                       │  │
│  │   - IBankAccountRepository                │  │
│  │   - ISecurityRepository                   │  │
│  │   - ILoanRepository                       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↑
                      │ implements
                      │
┌─────────────────────────────────────────────────┐
│            Infrastructure Layer                  │
│  ┌───────────────────┐  ┌───────────────────┐  │
│  │ Prisma Repos      │  │ In-Memory Repos   │  │
│  │ (PostgreSQL)      │  │ (Testing)         │  │
│  │                   │  │                   │  │
│  │ - PrismaUser      │  │ - InMemoryUser    │  │
│  │ - PrismaAccount   │  │ - InMemoryAccount │  │
│  │ - PrismaSecurity  │  │ - InMemorySecurity│  │
│  │ - PrismaLoan      │  │ - InMemoryLoan    │  │
│  └───────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Domain Layer Interfaces

Location: `src/domain/repositories/`

**Files:**
- `user.repository.interface.ts` - User persistence contract
- `bank-account.repository.interface.ts` - Account persistence contract
- `security.repository.interface.ts` - Security/Stock persistence contract
- `loan.repository.interface.ts` - Loan persistence contract

**Benefits:**
- ✅ Framework independence
- ✅ Testability
- ✅ Swappable implementations
- ✅ Inversion of Control

### 2. Prisma Implementations (SQL Adapter)

Location: `src/infrastructure/repositories/prisma/`

**Adapter:** PostgreSQL via Prisma ORM

**Files:**
- `user.repository.ts`
- `bank-account.repository.ts`
- `security.repository.ts`
- `loan.repository.ts`

**Features:**
- Full CRUD operations
- Transaction support
- Relationship handling
- Type-safe queries

### 3. In-Memory Implementations (Test Adapter)

Location: `src/infrastructure/repositories/in-memory/`

**Adapter:** In-Memory Map-based storage

**Files:**
- `user.repository.ts`
- `bank-account.repository.ts`
- `security.repository.ts`
- `loan.repository.ts`

**Features:**
- ✅ No database dependencies
- ✅ Fast unit testing
- ✅ Deterministic behavior
- ✅ Easy setup/teardown
- ✅ Helper methods for testing (`clear()`, `getAll()`)

**Implementation Details:**
```typescript
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, UserEntity> = new Map();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) || null;
  }

  async create(user: CreateUserDto): Promise<UserEntity> {
    const newUser: UserEntity = { ...user, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // ... other methods

  // Test helper
  clear(): void {
    this.users.clear();
  }
}
```

## Dependency Injection

### NestJS Module Configuration

File: `src/infrastructure/repositories/repository.module.ts`

```typescript
@Global()
@Module({
  providers: [
    // Default: Prisma implementations for production
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: BANK_ACCOUNT_REPOSITORY, useClass: PrismaBankAccountRepository },
    { provide: SECURITY_REPOSITORY, useClass: PrismaSecurityRepository },
    { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
  ],
  exports: [
    USER_REPOSITORY,
    BANK_ACCOUNT_REPOSITORY,
    SECURITY_REPOSITORY,
    LOAN_REPOSITORY,
  ],
})
export class RepositoryModule {}
```

### Usage in Use Cases

```typescript
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RegisterUserCommand) {
    // Use repository interface, implementation injected at runtime
    const existingUser = await this.userRepository.findByEmail(command.email);
    // ...
  }
}
```

## Testing with In-Memory Adapters

### Unit Test Example

File: `test/unit/repository.spec.ts`

```typescript
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
    });

    const found = await repository.findById('user-1');
    expect(found).toEqual(user);
  });

  // ... more tests
});
```

### Integration Test Override

```typescript
describe('RegisterUserHandler', () => {
  let handler: RegisterUserHandler;
  let repository: InMemoryUserRepository;

  beforeEach(async () => {
    repository = new InMemoryUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserHandler,
        // Override with in-memory implementation
        { provide: USER_REPOSITORY, useValue: repository },
      ],
    }).compile();

    handler = module.get<RegisterUserHandler>(RegisterUserHandler);
  });

  it('should register a new user', async () => {
    // Test without database
  });
});
```

## Comparison: Prisma vs In-Memory

| Feature | Prisma Adapter | In-Memory Adapter |
|---------|---------------|-------------------|
| **Use Case** | Production | Testing |
| **Database** | PostgreSQL | None (RAM) |
| **Speed** | Medium (~100ms) | Fast (<1ms) |
| **Persistence** | Durable | Volatile |
| **Setup** | Requires DB | Instant |
| **Transactions** | Full support | Simple |
| **Concurrency** | Real locks | Simulated |
| **Data Loss** | No | On restart |

## Running Tests

### Unit Tests (In-Memory)
```bash
npm run test:unit
```

### E2E Tests (Prisma)
```bash
npm run test:e2e
```

## Benefits of This Implementation

### 1. ✅ Technical Constraint Satisfied
- **2 Database Adapters**: PostgreSQL (Prisma) + In-Memory

### 2. ✅ Clean Architecture
- Domain layer defines contracts
- Infrastructure layer provides implementations
- Application layer depends on abstractions

### 3. ✅ Testability
- Fast unit tests without database
- Deterministic test results
- Easy mock data setup

### 4. ✅ Flexibility
- Easy to add new adapters (MongoDB, Redis, etc.)
- Can switch implementations via configuration
- No vendor lock-in

### 5. ✅ Maintainability
- Clear separation of concerns
- Single responsibility per repository
- Easy to understand and modify

## Future Extensions

### Adding a Third Adapter (MongoDB Example)

```typescript
// 1. Implement interface
export class MongoUserRepository implements IUserRepository {
  constructor(private readonly mongoClient: MongoClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const db = this.mongoClient.db('avenir');
    const user = await db.collection('users').findOne({ _id: id });
    return user ? this.mapToEntity(user) : null;
  }
  // ... other methods
}

// 2. Register in module
{
  provide: USER_REPOSITORY,
  useClass: MongoUserRepository, // or use environment variable
}
```

## Conclusion

This implementation demonstrates professional-grade software engineering:

1. **Repository Pattern** - Clean abstraction over data access
2. **Multiple Adapters** - PostgreSQL + In-Memory (satisfies requirement)
3. **Dependency Injection** - Loose coupling via interfaces
4. **Testability** - Fast unit tests without external dependencies
5. **Extensibility** - Easy to add more adapters

The architecture allows the same business logic (Domain layer) to work with different data sources seamlessly, proving true framework independence as required by Clean Architecture principles.
