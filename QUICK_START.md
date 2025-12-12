# AVENIR Banking - Quick Start Guide

## 🚀 Getting Started

This guide helps you quickly set up and run the AVENIR Banking application with both NestJS and Express frameworks.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/avenir_banking"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Server Ports
PORT=3000                # NestJS port
EXPRESS_PORT=3001        # Express port
```

3. **Set up database:**
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed test data
npm run seed
```

## Running the Application

### Option 1: Run NestJS Only (Default)
```bash
npm run start:dev
```
Server available at: `http://localhost:3000`

### Option 2: Run Express Only
```bash
npm run express:dev
```
Server available at: `http://localhost:3001`

### Option 3: Run Both Frameworks Simultaneously ⭐
```bash
npm run start:both
```
- NestJS: `http://localhost:3000`
- Express: `http://localhost:3001`

## Quick API Test

### 1. Register a User

**NestJS:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33612345678"
  }'
```

**Express:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "password": "SecurePass123",
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+33612345679"
  }'
```

### 2. Login

**NestJS:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "role": "CLIENT"
  }
}
```

### 3. Open Account (Authenticated)

Replace `YOUR_TOKEN` with the token from login:

```bash
curl -X POST http://localhost:3000/accounts/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "accountType": "CHECKING",
    "initialDeposit": 1000,
    "name": "Main Account"
  }'
```

### 4. Transfer Money

```bash
curl -X POST http://localhost:3000/accounts/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fromAccountId": "your-account-id",
    "toIban": "FR7612345678901234567890123",
    "amount": 100,
    "description": "Payment for services"
  }'
```

## Running Tests

### Unit Tests (In-Memory Repositories)
```bash
npm run test:unit
```

### E2E Tests (Full Database)
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Project Structure

```
src/
├── domain/              # Business logic (shared)
├── application/         # NestJS use cases
├── infrastructure/      # Technical implementations (shared)
│   └── repositories/
│       ├── prisma/     # PostgreSQL adapter
│       └── in-memory/  # Testing adapter
├── interface/           # NestJS controllers
└── express/            # Express implementation ⭐ NEW
    ├── server-express.ts
    ├── middleware/
    └── routes/
```

## Architecture Highlights

### 🎯 Clean Architecture
- Domain layer is framework-agnostic
- Both NestJS and Express use the same business logic
- Infrastructure is swappable (Prisma ↔ In-Memory)

### 🔄 Multiple Adapters
1. **PostgreSQL** (Prisma) - Production
2. **In-Memory** - Testing

### 🖥️ Dual Frameworks
1. **NestJS** (Port 3000) - Enterprise features
2. **Express** (Port 3001) - Lightweight API

### ⚡ Event Sourcing
- All domain events stored
- Time travel capability
- Event replay for aggregates

### 🎨 CQRS Pattern
- Commands for writes
- Queries for reads
- Separation of concerns

## Health Checks

### NestJS
```bash
curl http://localhost:3000
```

### Express
```bash
curl http://localhost:3001/health
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Run NestJS in development mode |
| `npm run express:dev` | Run Express in development mode |
| `npm run start:both` | Run both frameworks simultaneously |
| `npm run build` | Build NestJS for production |
| `npm run express:build` | Build Express for production |
| `npm run test:unit` | Run unit tests (in-memory) |
| `npm run test:e2e` | Run E2E tests (database) |
| `npm run lint` | Lint code |
| `npm run format` | Format code with Prettier |

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

## API Documentation

### Full API Reference
- [API Quick Reference](API-QUICK-REFERENCE.md)
- [API Testing Guide](API-TESTING-GUIDE.md)
- [Postman Collection](postman-collection.json)

### Feature Documentation
- [Repository Pattern](REPOSITORY_PATTERN_IMPLEMENTATION.md)
- [Express Implementation](EXPRESS_PARALLEL_IMPLEMENTATION.md)
- [Event Sourcing](EVENT_SOURCING_IMPLEMENTATION.md)
- [Banking Core](BANKING_CORE_IMPLEMENTATION.md)

## Production Deployment

### NestJS
```bash
npm run build
npm run start:prod
```

### Express
```bash
npm run express:build
node dist/express/server-express.js
```

### Docker (Optional)
```bash
docker-compose up -d
```

## Need Help?

- 📚 Documentation: Check the `/docs` folder
- 🐛 Issues: Review error logs in console
- 💬 Questions: Contact the development team

## Next Steps

1. ✅ Explore the API endpoints
2. ✅ Review the architecture documentation
3. ✅ Run the test suite
4. ✅ Try both NestJS and Express implementations
5. ✅ Understand the repository pattern

**Happy coding! 🚀**
