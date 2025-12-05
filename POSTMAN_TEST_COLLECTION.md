# Postman / cURL Test Collection for AVENIR Banking API

Base URL: `http://localhost:3000`

---

## 1. Health Check

### GET / - Check API Health

**cURL:**
```bash
curl --location 'http://localhost:3000/'
```

**Expected Response:**
```
Hello World!
```

---

## 2. Authentication Endpoints

### POST /auth/register - Register New User

**cURL:**
```bash
curl --location 'http://localhost:3000/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33612345678",
    "address": "123 Rue de la Paix",
    "city": "Paris",
    "postalCode": "75001",
    "country": "France",
    "dateOfBirth": "1990-05-15"
}'
```

**Expected Response:**
```json
{
    "message": "User registered successfully",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Notes:**
- Required fields: `email`, `password`, `firstName`, `lastName`
- Optional fields: `phone`, `address`, `city`, `postalCode`, `country`, `dateOfBirth`
- `dateOfBirth` must be in ISO 8601 format (YYYY-MM-DD)

---

### POST /auth/register - Register User (Minimal Fields)

**cURL:**
```bash
curl --location 'http://localhost:3000/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "jane.smith@example.com",
    "password": "Password123!",
    "firstName": "Jane",
    "lastName": "Smith"
}'
```

---

### POST /auth/login - User Login

**cURL:**
```bash
curl --location 'http://localhost:3000/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
}'
```

**Expected Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john.doe@example.com",
        "role": "CLIENT"
    }
}
```

---

## 3. Account Management Endpoints

### POST /accounts/open - Open New Bank Account

**cURL - Checking Account with Initial Deposit:**
```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "accountType": "CHECKING",
    "initialDeposit": 500
}'
```

**Expected Response:**
```json
{
    "message": "Account opened successfully",
    "accountId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "iban": "FR58 1234 5678 9000 0000 0000 100"
}
```

---

**cURL - Savings Account with Initial Deposit:**
```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "accountType": "SAVINGS",
    "initialDeposit": 1000
}'
```

---

**cURL - Investment Account (No Initial Deposit):**
```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "accountType": "INVESTMENT"
}'
```

**Notes:**
- Valid `accountType` values: `CHECKING`, `SAVINGS`, `INVESTMENT`
- `initialDeposit` is optional (defaults to 0)
- IBAN is automatically generated using Modulo 97 algorithm
- SAVINGS accounts have 2% annual interest rate by default

---

### GET /accounts/:id - Get Account Details

**cURL:**
```bash
curl --location 'http://localhost:3000/accounts/d290f1ee-6c54-4b01-90e6-d701748f0851'
```

**Expected Response:**
```json
{
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "iban": "FR58 1234 5678 9000 0000 0000 100",
    "accountType": "SAVINGS",
    "balance": "1000.00",
    "currency": "EUR",
    "status": "ACTIVE",
    "createdAt": "2025-12-04T10:30:00.000Z",
    "updatedAt": "2025-12-04T10:30:00.000Z",
    "operations": [
        {
            "id": "op-001",
            "accountId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
            "type": "DEPOSIT",
            "amount": "1000.00",
            "balanceAfter": "1000.00",
            "description": "Initial deposit",
            "createdAt": "2025-12-04T10:30:00.000Z"
        }
    ]
}
```

**Notes:**
- Returns account details with the last 10 operations
- Operations are sorted by `createdAt` in descending order

---

### GET /accounts/user/:userId - Get All Accounts for User

**cURL:**
```bash
curl --location 'http://localhost:3000/accounts/user/550e8400-e29b-41d4-a716-446655440000'
```

**Expected Response:**
```json
[
    {
        "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "iban": "FR58 1234 5678 9000 0000 0000 100",
        "accountType": "SAVINGS",
        "balance": "1000.00",
        "currency": "EUR",
        "status": "ACTIVE",
        "createdAt": "2025-12-04T10:30:00.000Z",
        "updatedAt": "2025-12-04T10:30:00.000Z"
    },
    {
        "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "iban": "FR76 1234 5678 9000 0000 0000 200",
        "accountType": "CHECKING",
        "balance": "500.00",
        "currency": "EUR",
        "status": "ACTIVE",
        "createdAt": "2025-12-04T11:00:00.000Z",
        "updatedAt": "2025-12-04T11:00:00.000Z"
    }
]
```

---

### POST /accounts/interest/calculate - Manually Trigger Interest Calculation

**cURL:**
```bash
curl --location --request POST 'http://localhost:3000/accounts/interest/calculate'
```

**Expected Response:**
```json
{
    "message": "Interest calculation completed",
    "processed": 3,
    "errors": 0
}
```

**Notes:**
- This endpoint manually triggers the daily interest calculation job
- Only processes SAVINGS accounts with ACTIVE status
- Interest formula: `balance × (annual_rate / 365)`
- Normally runs automatically at midnight via cron job

---

## Complete Test Flow Example

### Step 1: Register a New User

```bash
curl --location 'http://localhost:3000/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test.user@avenir.fr",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+33612345678",
    "address": "10 Avenue des Champs-Élysées",
    "city": "Paris",
    "postalCode": "75008",
    "country": "France",
    "dateOfBirth": "1985-03-20"
}'
```

**Save the `userId` from the response**

---

### Step 2: Login

```bash
curl --location 'http://localhost:3000/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test.user@avenir.fr",
    "password": "TestPassword123!"
}'
```

**Save the `access_token` for authenticated requests (when implemented)**

---

### Step 3: Open a Savings Account

```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "<userId-from-step-1>",
    "accountType": "SAVINGS",
    "initialDeposit": 5000
}'
```

**Save the `accountId` and `iban` from the response**

---

### Step 4: Open a Checking Account

```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "<userId-from-step-1>",
    "accountType": "CHECKING",
    "initialDeposit": 1000
}'
```

---

### Step 5: View Account Details

```bash
curl --location 'http://localhost:3000/accounts/<accountId-from-step-3>'
```

---

### Step 6: View All User Accounts

```bash
curl --location 'http://localhost:3000/accounts/user/<userId-from-step-1>'
```

---

### Step 7: Manually Trigger Interest Calculation (Admin/Testing)

```bash
curl --location --request POST 'http://localhost:3000/accounts/interest/calculate'
```

---

### Step 8: Check Updated Balance After Interest

```bash
curl --location 'http://localhost:3000/accounts/<accountId-from-step-3>'
```

**You should see interest added to the SAVINGS account balance**

---

## Error Cases to Test

### 1. Register with Existing Email

```bash
curl --location 'http://localhost:3000/auth/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test.user@avenir.fr",
    "password": "AnotherPassword123!",
    "firstName": "Duplicate",
    "lastName": "User"
}'
```

**Expected Response (409 Conflict):**
```json
{
    "message": "User with this email already exists",
    "error": "Conflict",
    "statusCode": 409
}
```

---

### 2. Login with Wrong Password

```bash
curl --location 'http://localhost:3000/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test.user@avenir.fr",
    "password": "WrongPassword123!"
}'
```

**Expected Response (401 Unauthorized):**
```json
{
    "message": "Invalid credentials",
    "error": "Unauthorized",
    "statusCode": 401
}
```

---

### 3. Open Account with Invalid Type

```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "accountType": "INVALID_TYPE",
    "initialDeposit": 100
}'
```

**Expected Response (400 Bad Request):**
```json
{
    "message": "Invalid account type. Must be one of: CHECKING, SAVINGS, INVESTMENT",
    "error": "Bad Request",
    "statusCode": 400
}
```

---

### 4. Open Account for Non-Existent User

```bash
curl --location 'http://localhost:3000/accounts/open' \
--header 'Content-Type: application/json' \
--data '{
    "userId": "00000000-0000-0000-0000-000000000000",
    "accountType": "CHECKING",
    "initialDeposit": 100
}'
```

**Expected Response (404 Not Found):**
```json
{
    "message": "User not found",
    "error": "Not Found",
    "statusCode": 404
}
```

---

### 5. Get Non-Existent Account

```bash
curl --location 'http://localhost:3000/accounts/00000000-0000-0000-0000-000000000000'
```

**Expected Response:**
```json
null
```

---

## PowerShell Alternative Commands

For Windows PowerShell users, here are equivalent commands:

### Register User:
```powershell
$body = @{
    email = "test.user@avenir.fr"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/auth/register" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Open Account:
```powershell
$body = @{
    userId = "550e8400-e29b-41d4-a716-446655440000"
    accountType = "SAVINGS"
    initialDeposit = 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/accounts/open" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Get Account:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/accounts/d290f1ee-6c54-4b01-90e6-d701748f0851" `
    -Method Get
```

---

## Postman Collection Import

To import these into Postman:

1. Create a new Collection named "AVENIR Banking API"
2. Set a collection variable `baseUrl` = `http://localhost:3000`
3. Create requests for each endpoint above, using `{{baseUrl}}` as the base
4. After registering a user, save the `userId` as a collection variable: `{{userId}}`
5. After opening an account, save the `accountId` as: `{{accountId}}`

---

## Event Sourcing Verification

To verify Event Sourcing is working, check the `events` table in the database:

```sql
-- View all events
SELECT * FROM events ORDER BY created_at DESC;

-- View events for a specific user
SELECT * FROM events 
WHERE aggregate_id = '550e8400-e29b-41d4-a716-446655440000' 
ORDER BY version ASC;

-- View events for a specific account
SELECT * FROM events 
WHERE aggregate_id = 'd290f1ee-6c54-4b01-90e6-d701748f0851' 
AND aggregate_type = 'BankAccount'
ORDER BY version ASC;
```

You should see events like:
- `USER_REGISTERED`
- `ACCOUNT_OPENED`
- `FUNDS_DEPOSITED`
- `INTEREST_APPLIED`

---

## IBAN Validation Examples

All generated IBANs follow the Modulo 97 algorithm:

**Valid AVENIR Bank IBANs:**
- `FR58 1234 5678 9000 0000 0000 100` ✓
- `FR76 1234 5678 9000 0000 0000 200` ✓
- Bank code always starts with `12345` (AVENIR)
- Check digits calculated using Modulo 97

**Invalid IBANs:**
- `FR99 1234 5678 9000 0000 0000 100` ✗ (wrong check digits)
- `FR58 9999 9999 9000 0000 0000 100` ✗ (wrong bank code, external transfer)

---

## Notes

- All timestamps are in UTC
- Amounts are stored as `Decimal(15,2)` in the database
- All IBANs are unique and validated using ISO 13616 standard
- Interest rate for SAVINGS accounts: 2% per annum (0.02)
- Daily interest = balance × (0.02 / 365)
