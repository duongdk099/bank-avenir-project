# 📮 Postman Collection - Quick Start Guide

## Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select `postman-collection.json`
4. Collection "AVENIR Bank - Complete API Collection" appears in sidebar

---

## Collection Variables

The collection uses these variables (auto-populated during tests):

| Variable | Description | Set By |
|----------|-------------|--------|
| `baseUrl` | API base URL | Manual (default: localhost:3000) |
| `authToken` | JWT token | Login request |
| `userId` | Current user ID | Register/Login |
| `accountId` | Account ID | Open Account |
| `iban` | Account IBAN | Open Account |
| `securityId` | Security ID | Create Security |
| `orderId` | Order ID | Place Order |
| `loanId` | Loan ID | Grant Loan |
| `conversationId` | Chat conversation ID | Get Conversations |

---

## Testing Workflow

### 1. Authentication Flow
```
1. POST /auth/register
   → Creates user
   → Returns: userId, confirmationToken
   
2. POST /auth/login
   → Login with email/password
   → Returns: access_token (auto-saved to authToken)
   → Status: ✅ Authenticated
```

### 2. Account Management Flow
```
3. POST /accounts/open
   → Body: { userId, accountType: "CHECKING", initialDeposit: 10000 }
   → Returns: accountId, iban (auto-saved)
   
4. GET /accounts/:accountId
   → View account details
   
5. GET /accounts/user/:userId
   → List all user accounts
```

### 3. Transfer Flow
```
6. POST /accounts/open (again for second account)
   → Save second IBAN
   
7. POST /accounts/transfer
   → Body: { fromAccountId, toIban, amount: 500 }
   → Transfer funds between accounts
```

### 4. Trading Flow (Admin Setup Required)
```
8. POST /admin/securities
   → Admin creates stock
   → Returns: securityId (auto-saved)
   
9. POST /accounts/open
   → accountType: "INVESTMENT"
   → Need investment account for trading
   
10. POST /orders
    → Place BUY/SELL order
    → Returns: orderId (auto-saved)
    
11. GET /orders/security/:securityId/book
    → View order book
    
12. DELETE /orders/:orderId
    → Cancel order
```

### 5. Loan Flow (Manager Required)
```
13. POST /loans/grant
    → Manager grants loan
    → Returns: loanId (auto-saved)
    
14. GET /loans/:loanId/schedule
    → View amortization schedule
```

---

## Request Examples

### Register User
```json
POST /auth/register
{
  "email": "client@avenir.com",
  "password": "SecurePass123!",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+33612345678",
  "address": "123 Rue de la Paix",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "dateOfBirth": "1990-01-15"
}
```

### Login
```json
POST /auth/login
{
  "email": "client@avenir.com",
  "password": "SecurePass123!"
}
```

### Open Account
```json
POST /accounts/open
Authorization: Bearer {{authToken}}
{
  "userId": "{{userId}}",
  "accountType": "CHECKING",
  "initialDeposit": 10000
}
```

### Transfer Funds
```json
POST /accounts/transfer
Authorization: Bearer {{authToken}}
{
  "fromAccountId": "{{accountId}}",
  "toIban": "FR7630001007941234567890999",
  "amount": 500,
  "description": "Test transfer"
}
```

### Place Order
```json
POST /orders
Authorization: Bearer {{authToken}}
{
  "userId": "{{userId}}",
  "accountId": "{{accountId}}",
  "securityId": "{{securityId}}",
  "type": "BUY",
  "quantity": 10,
  "price": 180.50
}
```

### Create Security (Admin)
```json
POST /admin/securities
Authorization: Bearer {{authToken}}
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "type": "STOCK",
  "exchange": "NASDAQ",
  "currentPrice": 180.50,
  "currency": "USD"
}
```

### Update Savings Rate (Admin)
```json
POST /admin/savings-rate
Authorization: Bearer {{authToken}}
{
  "accountType": "SAVINGS",
  "rate": 0.035,
  "minBalance": 1000,
  "effectiveDate": "2026-02-01"
}
```

### Grant Loan (Manager)
```json
POST /loans/grant
Authorization: Bearer {{authToken}}
{
  "userId": "{{userId}}",
  "accountId": "{{accountId}}",
  "principal": 25000,
  "annualRate": 0.055,
  "termMonths": 36,
  "insuranceRate": 0.01
}
```

---

## Test Scripts

Each request has built-in test scripts that:
- ✅ Validate status codes
- ✅ Check response structure
- ✅ Extract and save variables
- ✅ Verify data types

Example test script:
```javascript
pm.test('Status code is 201', function () {
    pm.response.to.have.status(201);
});

pm.test('Response contains userId', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('userId');
    pm.collectionVariables.set('userId', jsonData.userId);
});
```

---

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** Run Login request first to get auth token

### Issue: 404 Not Found
**Solution:** Check that baseUrl is set correctly (http://localhost:3000)

### Issue: Variable not found
**Solution:** Run requests in order to populate variables

### Issue: Account not found
**Solution:** Run "Open Account" request first

### Issue: Security not found
**Solution:** Admin must create security first

---

## Folder Structure

```
📁 AVENIR Bank Collection
├── 📁 Authentication
│   ├── Register User
│   ├── Confirm Email
│   └── Login
├── 📁 Accounts
│   ├── Open Account
│   ├── Get Account Details
│   ├── Get User Accounts
│   ├── Transfer Funds
│   ├── Rename Account
│   ├── Delete Account
│   └── Calculate Interest
├── 📁 Orders & Trading
│   ├── Place Order
│   ├── Get Order Details
│   ├── Get User Orders
│   ├── Get Order Book
│   ├── Get Executed Trades
│   └── Cancel Order
├── 📁 Loans
│   ├── Grant Loan
│   ├── Get Loan Details
│   ├── Get Amortization Schedule
│   ├── Get User Loans
│   └── Calculate Loan Payment Preview
├── 📁 Messages & Chat
│   ├── Get Conversations
│   ├── Get Conversation Messages
│   └── Get Unread Message Count
├── 📁 Notifications
│   ├── Get All Notifications
│   ├── Get Unread Notifications
│   ├── Get Unread Count
│   ├── Mark Notification as Read
│   └── Mark All as Read
└── 📁 Admin
    ├── Create Security/Stock
    ├── Get All Securities
    ├── Create Stock
    ├── Update Stock Availability
    ├── Delete Stock
    ├── Update Savings Rate
    ├── Get Savings Rates
    ├── Update User Role
    ├── Get All Users
    ├── Get Dashboard Stats
    ├── Create Account for Client
    ├── Rename Account (Admin)
    ├── Ban Account
    └── Close Account (Admin)
```

---

## Tips

### ⭐ Run Collection
Click "Run collection" to execute all requests sequentially with automated testing

### ⭐ Environment Setup
For testing multiple environments:
1. Create environment (Dev, Staging, Prod)
2. Set `baseUrl` in each environment
3. Switch between environments easily

### ⭐ Collection Runner
Use Collection Runner for:
- Automated regression testing
- CI/CD integration
- Performance testing
- Load testing

### ⭐ Pre-request Scripts
Add pre-request scripts for:
- Dynamic data generation
- Timestamp creation
- UUID generation

---

## Success Criteria

✅ All requests return expected status codes  
✅ Variables are automatically populated  
✅ Tests pass for valid requests  
✅ Tests fail appropriately for invalid requests  
✅ Can complete full user journey  

---

## Next Steps

1. ✅ Import collection
2. ✅ Set baseUrl to `http://localhost:3000`
3. ✅ Run Authentication → Register User
4. ✅ Run Authentication → Login
5. ✅ Explore other endpoints!

Happy Testing! 🚀
