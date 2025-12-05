# AVENIR Banking Application - Event Sourcing Engine

## Implementation Summary

This document provides an overview of the Event Sourcing and CQRS implementation for the AVENIR banking application.

## Architecture Components

### 1. **Shared Kernel (DDD)**

#### AggregateRoot (`domain/entities/aggregate-root.ts`)
Abstract base class for all domain aggregates with:
- Event application mechanism
- Uncommitted events tracking
- Event replay from history
- Version management for optimistic locking

#### Domain Events
- `IDomainEvent` interface
- `UserRegisteredEvent`
- `UserEmailConfirmedEvent`

### 2. **Event Store Infrastructure**

#### EventStore Service (`infrastructure/event-store/event-store.service.ts`)
Features:
- ✅ Saves events to Prisma Event table
- ✅ Publishes events to @nestjs/cqrs EventBus
- ✅ Optimistic locking via version column
- ✅ `getEventsForAggregate(aggregateId)` for event replay
- ✅ Transaction support for atomic operations

### 3. **Authentication & Authorization (IAM)**

#### AuthService (`infrastructure/auth/auth.service.ts`)
- Password hashing with bcrypt (10 salt rounds)
- JWT token generation
- User validation

#### JWT Payload Structure (Section 5.1 compliant)
```typescript
{
  sub: string;        // userId
  role: 'CLIENT' | 'ADMIN' | 'MANAGER';
  permissions: string[];
}
```

#### Role-Based Permissions
- **CLIENT**: account:read, account:transfer, profile:read, profile:update
- **ADMIN**: account:*, user:*, including delete
- **MANAGER**: account:*, user:*, report:read, loan:approve

#### Security Components
- `JwtStrategy` - Passport JWT strategy
- `JwtAuthGuard` - Route protection
- Token expiration: 24 hours

### 4. **User Domain**

#### UserAggregate (`domain/entities/user.aggregate.ts`)
Domain logic:
- ✅ `UserAggregate.register()` - Factory method
- ✅ `confirmEmail()` - Business method
- ✅ Event handlers for USER_REGISTERED and USER_EMAIL_CONFIRMED
- State management: email, passwordHash, role, status, emailConfirmed

### 5. **CQRS Implementation**

#### Commands
- `RegisterUserCommand` - User registration
- Handler: `RegisterUserHandler`
  - Checks for duplicate email
  - Hashes password
  - Creates aggregate
  - Saves to event store
  - Creates read model projection

#### Queries
- `LoginQuery` - User authentication
- Handler: `LoginHandler`
  - Validates credentials
  - Returns JWT token and user data

#### DTOs
- `RegisterUserDto` - Registration input
- `LoginDto` - Login input

### 6. **HTTP Interface**

#### AuthController (`interface/http/controllers/auth.controller.ts`)
Endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication

## Module Structure

```
AppModule
├── PrismaModule (Global)
├── AuthModule
│   ├── JwtModule
│   ├── PassportModule
│   └── AuthService, JwtStrategy
├── EventStoreModule
│   ├── CqrsModule
│   └── EventStore
└── UserModule
    ├── CqrsModule
    ├── CommandHandlers
    ├── QueryHandlers
    └── AuthController
```

## Key Features

### Optimistic Locking
The EventStore checks the version column before saving events to prevent concurrency conflicts:
```typescript
if (currentVersion !== expectedVersion - events.length) {
  throw new ConflictException('Concurrency conflict');
}
```

### Event Replay
Aggregates can be reconstructed from events:
```typescript
const events = await eventStore.getEventsForAggregate(id, 'User');
aggregate.loadFromHistory(events);
```

### Event Publishing
After successful persistence, events are published to the EventBus for projections and saga processing.

## Testing the Implementation

### 1. Register a User
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Login
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response includes JWT token with proper payload structure.

## Next Steps

1. Implement account aggregates and commands
2. Add event handlers for read model projections
3. Implement saga patterns for complex workflows
4. Add integration tests
5. Set up event versioning strategy
