# AVENIR Banking - Event Sourcing & CQRS Implementation

## ✅ Completed Implementation

### 1. **Shared Kernel (DDD) - Domain Layer**

#### Files Created:
- `src/domain/entities/domain-event.interface.ts` - Base event interface
- `src/domain/entities/aggregate-root.ts` - Abstract aggregate root class
- `src/domain/entities/user.aggregate.ts` - User domain aggregate
- `src/domain/entities/events/user-registered.event.ts` - USER_REGISTERED event
- `src/domain/entities/events/user-email-confirmed.event.ts` - USER_EMAIL_CONFIRMED event

#### Key Features:
```typescript
export abstract class AggregateRoot {
  protected id: string;
  protected version: number = 0;
  private uncommittedEvents: IDomainEvent[] = [];
  
  protected apply(event: IDomainEvent): void
  public loadFromHistory(events: IDomainEvent[]): void
  public getUncommittedEvents(): IDomainEvent[]
  public markEventsAsCommitted(): void
}
```

---

### 2. **Event Store Infrastructure**

#### Files Created:
- `src/infrastructure/event-store/event-store.service.ts`
- `src/infrastructure/event-store/event-store.module.ts`

#### Capabilities:
✅ **Save Events**: Atomic transaction saving to Prisma Event table  
✅ **Optimistic Locking**: Version-based concurrency control  
✅ **Event Publishing**: Publishes to @nestjs/cqrs EventBus after persistence  
✅ **Event Replay**: `getEventsForAggregate(aggregateId)` retrieves event history  

#### Optimistic Locking Implementation:
```typescript
const currentVersion = lastEvent?.version ?? -1;

if (currentVersion !== expectedVersion - events.length) {
  throw new ConflictException(
    `Concurrency conflict: Expected version ${expectedVersion - events.length}, ` +
    `but current version is ${currentVersion}`
  );
}
```

---

### 3. **Authentication & IAM**

#### Files Created:
- `src/infrastructure/auth/auth.service.ts` - Authentication logic
- `src/infrastructure/auth/jwt.strategy.ts` - Passport JWT strategy
- `src/infrastructure/auth/jwt-auth.guard.ts` - Route guard
- `src/infrastructure/auth/jwt-payload.interface.ts` - Token payload type
- `src/infrastructure/auth/auth.module.ts` - Auth module configuration

#### JWT Payload Structure (Section 5.1 Compliant):
```typescript
interface JwtPayload {
  sub: string;        // User ID
  role: 'CLIENT' | 'ADMIN' | 'MANAGER';
  permissions: string[];
}
```

#### Role Permissions:
| Role | Permissions |
|------|------------|
| **CLIENT** | `account:read`, `account:transfer`, `profile:read`, `profile:update` |
| **ADMIN** | `account:*`, `user:*` (including delete) |
| **MANAGER** | `account:*`, `user:*`, `report:read`, `loan:approve` |

#### Security Features:
- **Password Hashing**: bcrypt with 10 salt rounds
- **Token Expiration**: 24 hours
- **Account Status Check**: Only ACTIVE users can login

---

### 4. **User Domain Aggregate**

#### User Aggregate Implementation:
```typescript
export class UserAggregate extends AggregateRoot {
  // Factory method
  static register(id, email, passwordHash, role): UserAggregate
  
  // Business methods
  confirmEmail(): void
  
  // Event handlers
  private onUserRegistered(event: UserRegisteredEvent)
  private onUserEmailConfirmed(event: UserEmailConfirmedEvent)
}
```

#### Domain Events:
1. **USER_REGISTERED** - Fired when user creates account
2. **USER_EMAIL_CONFIRMED** - Fired when user confirms email

---

### 5. **CQRS Implementation**

#### Commands:
**`RegisterUserCommand`**
- Handler: `RegisterUserHandler`
- Location: `src/application/use-cases/register-user.handler.ts`
- Process:
  1. Check email uniqueness
  2. Hash password with bcrypt
  3. Create UserAggregate
  4. Save to Event Store (optimistic locking applied)
  5. Create Read Model projection in Prisma

#### Queries:
**`LoginQuery`**
- Handler: `LoginHandler`
- Location: `src/application/use-cases/login.handler.ts`
- Process:
  1. Validate user credentials
  2. Check account status
  3. Generate JWT token with permissions
  4. Return access token + user data

#### DTOs:
- `RegisterUserDto` - Registration input validation
- `LoginDto` - Login credentials

---

### 6. **HTTP Interface Layer**

#### Auth Controller:
`src/interface/http/controllers/auth.controller.ts`

**Endpoints:**

**POST `/auth/register`**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678",
  "address": "123 Main St",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "dateOfBirth": "1990-01-01"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "uuid-here"
}
```

**POST `/auth/login`**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CLIENT",
    "profile": { ... }
  }
}
```

---

### 7. **Module Architecture**

```
AppModule
├── PrismaModule (Global)
│   └── PrismaService
├── AuthModule
│   ├── JwtModule (24h expiration)
│   ├── PassportModule (JWT strategy)
│   ├── AuthService
│   └── JwtStrategy
├── EventStoreModule
│   ├── CqrsModule (CommandBus, QueryBus, EventBus)
│   └── EventStore
└── UserModule
    ├── CqrsModule
    ├── AuthController
    ├── RegisterUserHandler
    └── LoginHandler
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | NestJS with Fastify |
| **CQRS** | @nestjs/cqrs |
| **Authentication** | JWT via @nestjs/jwt + passport-jwt |
| **Password Hashing** | bcrypt (10 rounds) |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Event Store** | Custom implementation with Prisma |

---

## Database Schema

### Events Table:
```prisma
model Event {
  id              String   @id @default(uuid())
  aggregateId     String   @map("aggregate_id")
  aggregateType   String   @map("aggregate_type")
  version         Int
  type            String
  payload         Json
  createdAt       DateTime @default(now()) @map("created_at")
  
  @@unique([aggregateId, version])  // Optimistic locking
  @@map("events")
}
```

---

## Testing Guide

### 1. Start PostgreSQL
Ensure PostgreSQL is running at:
```
postgresql://postgres:123456@localhost:5432/orderproject
```

### 2. Run Migrations
```bash
npx prisma migrate dev --name init
```

### 3. Start Application
```bash
npm run start:dev
```

### 4. Test Registration
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@avenir.bank",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 5. Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@avenir.bank",
    "password": "SecurePass123!"
  }'
```

### 6. Verify Event Store
Check the `events` table in PostgreSQL:
```sql
SELECT * FROM events WHERE aggregate_type = 'User';
```

You should see:
- `USER_REGISTERED` events with version 1
- Full event payload stored as JSON

---

## Key Implementation Highlights

### ✅ Event Sourcing
- All state changes captured as events
- Events stored in immutable event log
- Aggregates reconstructable from event history

### ✅ CQRS
- Clear separation: Commands vs Queries
- Command handlers modify state
- Query handlers read optimized projections

### ✅ Optimistic Locking
- Version-based concurrency control
- Prevents lost updates in concurrent scenarios
- Fails fast with ConflictException

### ✅ Clean Architecture
- Domain logic isolated from infrastructure
- Dependency inversion (repositories as interfaces)
- Clear layer boundaries

### ✅ DDD Patterns
- Aggregates enforce business invariants
- Domain events express business facts
- Value objects for type safety

---

## Next Steps

1. **Event Handlers**: Create event handlers for updating read models
2. **Account Aggregate**: Implement BankAccount aggregate with operations
3. **Saga Patterns**: Implement process managers for complex workflows
4. **Projections**: Build specialized read models for queries
5. **Event Versioning**: Add event upcasting for schema evolution
6. **Snapshots**: Optimize aggregate loading for high-volume aggregates
7. **Integration Tests**: Test complete user journeys

---

## Dependencies Installed

```json
{
  "dependencies": {
    "@nestjs/cqrs": "^10.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/platform-fastify": "^10.x",
    "passport": "^0.x",
    "passport-jwt": "^4.x",
    "bcrypt": "^5.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "@types/passport-jwt": "^4.x",
    "@types/bcrypt": "^5.x",
    "@types/uuid": "^9.x"
  }
}
```

---

## Configuration

### Environment Variables (Optional):
Create `.env` file:
```env
JWT_SECRET=your-super-secret-key-change-in-production
PORT=3000
```

**Note**: Currently using default values in code. For production, use environment variables!

---

## Summary

The AVENIR banking application now has a complete Event Sourcing and CQRS foundation:

- ✅ **Shared Kernel**: AggregateRoot with event handling
- ✅ **Event Store**: Persistent, version-controlled event storage
- ✅ **Authentication**: JWT-based IAM with role permissions
- ✅ **User Domain**: Complete User aggregate with events
- ✅ **CQRS**: Registration command and login query
- ✅ **HTTP API**: RESTful endpoints for user management

The system is ready for building banking features with strong consistency, audit trails, and temporal queries!
