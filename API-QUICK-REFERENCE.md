# 🎯 API Quick Reference

## Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login and get JWT token |

**Headers:** `Content-Type: application/json`

---

## 👤 User Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/admin/users` | ✅ | ADMIN, MANAGER | List all users |
| PUT | `/admin/users/:id/role` | ✅ | ADMIN | Update user role |

---

## 🏦 Accounts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/accounts/open` | ✅ | Open new account |
| GET | `/accounts/:id` | ✅ | Get account details |
| GET | `/accounts/user/:userId` | ✅ | Get user's accounts |
| POST | `/accounts/interest/calculate` | ✅ | Calculate interest |

---

## 💼 Securities

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/admin/securities` | ✅ | ADMIN | Create security |
| GET | `/admin/securities` | ✅ | ADMIN, MANAGER | List securities |
| PUT | `/admin/securities/:id/price` | ✅ | ADMIN, MANAGER | Update price |

---

## 📈 Orders & Trading

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | ✅ | Place order (BUY/SELL) |
| GET | `/orders/:id` | ✅ | Get order details |
| GET | `/orders/user/:userId` | ✅ | Get user orders |
| GET | `/orders/security/:securityId/book` | ✅ | Get order book |
| GET | `/orders/account/:accountId/trades` | ✅ | Get executed trades |
| DELETE | `/orders/:id` | ✅ | Cancel order |

---

## 💰 Loans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/loans/grant` | ✅ | Grant loan |
| GET | `/loans/:id` | ✅ | Get loan details |
| GET | `/loans/:id/schedule` | ✅ | Get amortization schedule |
| GET | `/loans/user/:userId` | ✅ | Get user loans |
| POST | `/loans/:id/calculate-payment` | ✅ | Calculate payment preview |

---

## 💬 Chat & Messages

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/conversations?userId=xxx` | ✅ | List conversations |
| GET | `/messages/conversations/:id` | ✅ | Get conversation messages |
| GET | `/messages/unread?userId=xxx` | ✅ | Get unread count |

**WebSocket:** `ws://localhost:3000/chat?userId=xxx`

---

## 🔔 Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications?userId=xxx` | ✅ | Get notifications |
| GET | `/notifications?userId=xxx&unreadOnly=true` | ✅ | Get unread only |
| GET | `/notifications/unread-count?userId=xxx` | ✅ | Get unread count |
| POST | `/notifications/:id/read` | ✅ | Mark as read |
| POST | `/notifications/read-all?userId=xxx` | ✅ | Mark all as read |

**SSE Stream:** `GET /sse/notifications?userId=xxx`

---

## ⚙️ Admin Settings

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/admin/savings-rate` | ✅ | ADMIN | Create savings rate |
| GET | `/admin/savings-rates` | ✅ | ADMIN, MANAGER | List savings rates |
| GET | `/admin/dashboard` | ✅ | ADMIN, MANAGER | Dashboard stats |

---

## 📡 Real-Time Endpoints

### WebSocket Chat
```
ws://localhost:3000/chat?userId={userId}
```

**Events (Client → Server):**
- `private_message` - Send message
- `request_help` - Request help from advisor
- `accept_help` - Accept help request (advisor)
- `mark_read` - Mark messages as read

**Events (Server → Client):**
- `new_message` - Receive message
- `help_request` - Help request broadcast (advisors)
- `help_accepted` - Help accepted (client)
- `request_taken` - Request taken by another advisor

### Server-Sent Events
```
GET /sse/notifications?userId={userId}
```

**Event Types:**
- `ORDER_EXECUTED`
- `LOAN_GRANTED`
- `SAVINGS_RATE_CHANGED`
- `PRIVATE_MESSAGE_SENT`
- `ACCOUNT_CREDITED`
- `ACCOUNT_DEBITED`

---

## 📦 Request Body Examples

### Register User
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "postalCode": "10001",
  "country": "USA",
  "dateOfBirth": "1990-01-15"
}
```

### Open Account
```json
{
  "userId": "user-id",
  "accountType": "CHECKING",
  "initialDeposit": 10000
}
```

### Place Order
```json
{
  "userId": "user-id",
  "accountId": "account-id",
  "securityId": "security-id",
  "type": "BUY",
  "quantity": 10,
  "price": 180.50
}
```

### Grant Loan
```json
{
  "userId": "user-id",
  "accountId": "account-id",
  "principal": 25000,
  "annualRate": 0.055,
  "termMonths": 36,
  "insuranceRate": 0.01
}
```

### Create Security
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "type": "STOCK",
  "exchange": "NASDAQ",
  "currentPrice": 180.50,
  "currency": "USD"
}
```

---

## 🔑 Authentication Header

All authenticated endpoints require:
```
Authorization: Bearer {accessToken}
```

Get token from `/auth/login` response.

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🎭 User Roles

| Role | Permissions |
|------|-------------|
| CLIENT | Own accounts, orders, loans |
| MANAGER | + View users, update prices, chat advisor |
| ADMIN | + Create securities, update rates, manage roles |

---

## 💡 Quick Tips

### Get Account Balance
```bash
GET /accounts/{accountId}
# Response: { balance: 10000, reserved: 500, ... }
```

### Check Order Status
```bash
GET /orders/{orderId}
# Status: PENDING, EXECUTED, CANCELLED
```

### View Portfolio
```sql
-- Via Prisma Studio or database
SELECT * FROM portfolios WHERE account_id = 'account-id';
```

### Test WebSocket
```javascript
const socket = io('http://localhost:3000/chat', {
  query: { userId: 'your-user-id' }
});

socket.on('connect', () => console.log('Connected'));
socket.emit('private_message', {
  receiverId: 'other-user-id',
  content: 'Hello!'
});
```

### Test SSE
```javascript
const es = new EventSource('http://localhost:3000/sse/notifications?userId=your-user-id');
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## 🔍 Testing Order Matching

**Scenario: Execute a trade**

1. **Create 2 users** (buyer and seller)
2. **Create security** (e.g., AAPL @ $180.50)
3. **Give seller securities** (insert into portfolios table)
4. **Place buy order** (User 1: BUY 10 @ $180.50)
5. **Place sell order** (User 2: SELL 10 @ $180.50)
6. **Check trades** (`GET /orders/account/{accountId}/trades`)
7. **Verify portfolios updated** (Buyer has +10 AAPL, Seller has -10)
8. **Verify balances updated** (Buyer -$1805, Seller +$1805)

---

## 🛠️ Useful cURL Commands

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bank.com","password":"Test123!","firstName":"John","lastName":"Doe","phone":"+1234567890","address":"123 Main St","city":"NYC","postalCode":"10001","country":"USA","dateOfBirth":"1990-01-01"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bank.com","password":"Test123!"}'
```

### Get Accounts (with token)
```bash
curl -X GET http://localhost:3000/accounts/user/{userId} \
  -H "Authorization: Bearer {token}"
```

---

## 📁 File Locations

- **Collection:** `postman-collection.json`
- **Environment:** `postman-environment.json`
- **Test Data:** `seed-test-data.sql`
- **WebSocket Test:** `test-chat.html`
- **Full Guide:** `API-TESTING-GUIDE.md`

---

**🚀 Start Server:** `npm run start:dev`  
**🗄️ Database GUI:** `npx prisma studio`  
**🏗️ Generate Types:** `npx prisma generate`

---

*Version 1.0 | December 2024*
