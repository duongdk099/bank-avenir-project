# Quick Setup & Test Commands

## Initial Setup

### 1. Database Migration
```powershell
npx prisma migrate dev --name init
```

### 2. Generate Prisma Client (if needed)
```powershell
npx prisma generate
```

### 3. Build Application
```powershell
npm run build
```

### 4. Start Development Server
```powershell
npm run start:dev
```

---

## Testing the API

### Test User Registration
```powershell
curl -X POST http://localhost:3000/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"alice@avenir.bank\",
    \"password\": \"SecurePass123!\",
    \"firstName\": \"Alice\",
    \"lastName\": \"Johnson\",
    \"phone\": \"+33612345678\",
    \"city\": \"Paris\",
    \"country\": \"France\"
  }'
```

### Test User Login
```powershell
curl -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"alice@avenir.bank\",
    \"password\": \"SecurePass123!\"
  }'
```

---

## Prisma Commands

### Open Prisma Studio (Database GUI)
```powershell
npx prisma studio
```

### View Database Schema
```powershell
npx prisma db pull
```

### Reset Database (Warning: Deletes all data)
```powershell
npx prisma migrate reset
```

---

## PostgreSQL Queries (Direct Database)

### View All Events
```sql
SELECT 
  id, 
  aggregate_type, 
  aggregate_id, 
  type, 
  version, 
  created_at 
FROM events 
ORDER BY created_at DESC;
```

### View User Events
```sql
SELECT 
  aggregate_id, 
  type, 
  version, 
  payload
FROM events 
WHERE aggregate_type = 'User'
ORDER BY aggregate_id, version;
```

### View All Users
```sql
SELECT 
  u.id, 
  u.email, 
  u.role, 
  u.status,
  p.first_name,
  p.last_name
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id;
```

---

## Development Commands

### Watch Mode (Auto-restart on changes)
```powershell
npm run start:dev
```

### Production Build
```powershell
npm run build
npm run start:prod
```

### Run Tests (when available)
```powershell
npm run test
npm run test:e2e
```

### Linting
```powershell
npm run lint
```

---

## Useful VS Code REST Client Tests

Create a file `test.http` in your project root:

```http
### Register User
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "bob@avenir.bank",
  "password": "SecurePass123!",
  "firstName": "Bob",
  "lastName": "Smith",
  "phone": "+33612345678",
  "city": "Lyon",
  "country": "France"
}

### Login
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "bob@avenir.bank",
  "password": "SecurePass123!"
}

### Get Profile (Protected - requires JWT)
GET http://localhost:3000/profile
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## Project Structure Verification

### List All Domain Entities
```powershell
Get-ChildItem -Path ".\src\domain\entities" -Recurse -File
```

### List All Use Cases
```powershell
Get-ChildItem -Path ".\src\application\use-cases" -Recurse -File
```

### List All Controllers
```powershell
Get-ChildItem -Path ".\src\interface\http\controllers" -Recurse -File
```

---

## Docker PostgreSQL (Optional)

If you need to run PostgreSQL in Docker:

```powershell
docker run --name avenir-postgres `
  -e POSTGRES_PASSWORD=123456 `
  -e POSTGRES_DB=orderproject `
  -p 5432:5432 `
  -d postgres:16
```

Stop:
```powershell
docker stop avenir-postgres
```

Start:
```powershell
docker start avenir-postgres
```

Remove:
```powershell
docker rm -f avenir-postgres
```

---

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Clear Node Modules
```powershell
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "package-lock.json" -Force
npm install
```

### Prisma Client Issues
```powershell
npx prisma generate --force
```

### Check NestJS Version
```powershell
nest --version
```

---

## Next Development Tasks

1. **Create Account Aggregate**
   - Commands: OpenAccount, Deposit, Withdraw, Transfer
   - Events: AccountOpened, MoneyDeposited, MoneyWithdrawn, MoneyTransferred

2. **Add Event Handlers**
   - Update read models when events are published
   - Implement projections for queries

3. **Implement Protected Endpoints**
   - Use JwtAuthGuard on controllers
   - Add role-based authorization

4. **Add Validation**
   - Use class-validator decorators in DTOs
   - Implement custom validation rules

5. **Write Tests**
   - Unit tests for aggregates
   - Integration tests for use cases
   - E2E tests for API endpoints
