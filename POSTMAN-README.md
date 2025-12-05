# 📬 Postman Collection - Bank Project API

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman Desktop or Web
2. Click **Import** button (top left)
3. Select `postman-collection.json`
4. Collection appears as **"Bank Project - Complete API Collection"**

### 2. Import Environment (Optional but Recommended)
1. Click **Import** button
2. Select `postman-environment.json`
3. Select environment in top-right dropdown: **"Bank Project - Local Development"**

### 3. Start Backend Server
```powershell
cd "c:\Users\barry\Documents\study\bank-project-school\version 0"
npm run start:dev
```

Wait for: `Application is running on: http://localhost:3000`

### 4. Run First Request
1. Expand folder **"1. Authentication"**
2. Click **"Register Client User"**
3. Click **Send** button
4. ✅ Success: `201 Created` with `userId` in response

---

## 📂 Collection Structure

### **1. Authentication** (3 requests)
- Register Client User
- Register Manager User  
- Login Client

**Purpose:** Create users and obtain JWT tokens for authentication.

**Variables Set:**
- `userId` - Saved after registration/login
- `accessToken` - Saved after login (auto-used in all subsequent requests)

---

### **2. Accounts** (5 requests)
- Open Checking Account
- Open Savings Account
- Get Account by ID
- Get User Accounts
- Calculate Interest

**Purpose:** Create and manage bank accounts.

**Variables Set:**
- `accountId` - Saved after opening account

**Note:** Must authenticate first (run folder 1)

---

### **3. Admin (Securities & Settings)** (9 requests)
- Create Security - AAPL
- Create Security - TSLA
- Get All Securities
- Update Security Price
- Create Savings Rate
- Get Savings Rates
- Get All Users
- Update User Role
- Get Dashboard Stats

**Purpose:** Administrative operations (securities, rates, user management).

**Variables Set:**
- `securityId` - Saved after creating security

**Role Required:** ADMIN or MANAGER (may need to update user role first)

---

### **4. Orders & Trading** (7 requests)
- Place Buy Order - AAPL
- Place Sell Order - AAPL
- Get Order by ID
- Get User Orders
- Get Order Book
- Get Account Trades
- Cancel Order

**Purpose:** Stock trading operations.

**Variables Set:**
- `orderId` - Saved after placing order

**Prerequisites:**
- Account must exist (folder 2)
- Securities must exist (folder 3)
- For SELL orders: Must own securities (see `seed-test-data.sql`)

---

### **5. Loans** (5 requests)
- Grant Loan
- Get Loan by ID
- Get Loan Schedule
- Get User Loans
- Calculate Loan Payment

**Purpose:** Loan management and amortization.

**Variables Set:**
- `loanId` - Saved after granting loan

**Note:** Loan funds are immediately credited to account balance.

---

### **6. Chat & Messages** (3 requests)
- Get Conversations
- Get Conversation Messages
- Get Unread Messages Count

**Purpose:** REST API for chat history (WebSocket chat in `test-chat.html`).

**Variables Used:**
- `conversationId` - Set manually or from WebSocket events

---

### **7. Notifications** (5 requests)
- Get All Notifications
- Get Unread Notifications
- Get Unread Count
- Mark Notification as Read
- Mark All Notifications as Read

**Purpose:** Historical notification access (SSE provides real-time).

---

### **8. Server-Sent Events (SSE)** (1 request)
- SSE - Real-time Notifications

**Purpose:** Real-time notification streaming (event source).

**Note:** This maintains a persistent connection. Test in browser console:
```javascript
const eventSource = new EventSource('http://localhost:3000/sse/notifications?userId=your-user-id');
eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## 🔐 Authentication

All requests (except register/login) require JWT authentication.

### How It Works:
1. **Login** → Receives `accessToken`
2. **Auto-saved** to `{{accessToken}}` variable
3. **Auto-sent** in `Authorization: Bearer {{accessToken}}` header

### Token Lifetime:
- Default: 1 hour (3600 seconds)
- When expired: Re-run "Login Client" request

### Manual Token Setup:
If auto-save fails:
1. Copy `accessToken` from login response
2. Go to **Variables** tab (bottom of collection)
3. Paste into `accessToken` value

---

## 🎯 Test Flow Scenarios

### Scenario 1: New User Journey
```
1. Register Client User
2. Login Client
3. Open Checking Account
4. Open Savings Account
5. Get User Accounts (verify created)
```

### Scenario 2: Trading Flow
```
1-5. (Complete Scenario 1)
6. Create Security - AAPL (requires ADMIN role)
7. Place Buy Order - AAPL
8. Get User Orders (verify pending)
9. Get Order Book (see order in book)
```

### Scenario 3: Loan Application
```
1-5. (Complete Scenario 1)
6. Calculate Loan Payment (preview)
7. Grant Loan
8. Get Loan Schedule (see amortization)
9. Get Account by ID (verify balance increased)
```

### Scenario 4: Admin Operations
```
1. Login as Admin user
2. Get Dashboard Stats
3. Get All Users
4. Create Security
5. Update Security Price
6. Create Savings Rate
```

---

## 🔧 Variables Reference

| Variable | Description | Set By | Example |
|----------|-------------|--------|---------|
| `baseUrl` | API base URL | Manual | `http://localhost:3000` |
| `accessToken` | JWT token | Login request | `eyJhbGciOiJIUzI1Ni...` |
| `userId` | Current user ID | Register/Login | `user-001` |
| `accountId` | Current account ID | Open Account | `account-001` |
| `securityId` | Current security ID | Create Security | `security-aapl` |
| `orderId` | Current order ID | Place Order | `order-001` |
| `loanId` | Current loan ID | Grant Loan | `loan-001` |
| `conversationId` | Chat conversation ID | WebSocket/Manual | `conv-001` |

---

## 📝 Request Examples

### Register User
```json
POST /auth/register
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

### Place Order
```json
POST /orders
{
  "userId": "{{userId}}",
  "accountId": "{{accountId}}",
  "securityId": "{{securityId}}",
  "type": "BUY",
  "quantity": 10,
  "price": 180.50
}
```

### Grant Loan
```json
POST /loans/grant
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

## 🧪 Test Scripts

### Auto-Save Variables
Each request has test scripts that automatically save response data to variables:

**Example: Register User**
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    if (response.userId) {
        pm.collectionVariables.set('userId', response.userId);
    }
}
```

**Example: Login**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.accessToken) {
        pm.collectionVariables.set('accessToken', response.accessToken);
    }
}
```

### Global Test Script
Runs after every request:
```javascript
if (pm.response.code >= 400) {
    console.error('Error Response:', pm.response.json());
} else {
    console.log('Success:', pm.response.code);
}
```

---

## 🐛 Common Errors

### 401 Unauthorized
**Cause:** Missing or expired JWT token  
**Fix:** Run "Login Client" request

### 403 Forbidden
**Cause:** Insufficient role permissions  
**Fix:** Update user role to ADMIN/MANAGER via admin endpoint

### 404 Not Found
**Cause:** Resource doesn't exist (user, account, security, etc.)  
**Fix:** Create resource first (follow test flow scenarios)

### 400 Bad Request - "Insufficient funds"
**Cause:** Account balance too low for order  
**Fix:** Check account balance, reduce order size, or deposit more

### 400 Bad Request - "Insufficient securities"
**Cause:** Trying to sell securities you don't own  
**Fix:** Buy securities first or seed test data (see `seed-test-data.sql`)

---

## 🛠️ Advanced Features

### Run Entire Folder
1. Hover over folder name (e.g., "1. Authentication")
2. Click **three dots** (⋯)
3. Click **"Run folder"**
4. Click **"Run"** button
5. All requests execute in sequence

### Collection Runner
1. Click collection name
2. Click **"Run"** button (right panel)
3. Select folder or entire collection
4. Set iterations, delay
5. Click **"Run Collection"**

### Export Results
After Collection Runner:
1. Click **"Export Results"** button
2. Choose format (JSON, CSV)
3. Analyze in Excel/tools

---

## 📊 Response Examples

### Successful Login
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-001",
    "email": "client@bank.com",
    "role": "CLIENT",
    "status": "ACTIVE"
  }
}
```

### Order Response
```json
{
  "message": "Order placed successfully",
  "orderId": "order-001",
  "status": "PENDING",
  "reservedAmount": 1805.00
}
```

### Loan Schedule Item
```json
{
  "installmentNumber": 1,
  "dueDate": "2025-01-05T00:00:00.000Z",
  "principalPayment": 625.42,
  "interestPayment": 114.58,
  "insurancePayment": 6.94,
  "totalPayment": 746.94,
  "remainingBalance": 24374.58,
  "status": "PENDING"
}
```

---

## 🔗 Related Files

- **`postman-collection.json`** - This collection
- **`postman-environment.json`** - Environment variables
- **`API-TESTING-GUIDE.md`** - Comprehensive testing guide
- **`test-chat.html`** - WebSocket chat testing
- **`seed-test-data.sql`** - Database test data seeding
- **`IMPLEMENTATION-SUMMARY.md`** - Feature documentation

---

## 📞 Support

**Issues?**
1. Check server is running: `npm run start:dev`
2. Verify database connection
3. Check console for errors
4. Review `API-TESTING-GUIDE.md`

**Need test data?**
- Run `seed-test-data.sql` (see file for instructions)
- Or use Prisma Studio: `npx prisma studio`

---

## ✅ Success Checklist

- [ ] Server running on port 3000
- [ ] Collection imported into Postman
- [ ] Environment selected (optional)
- [ ] Can register new user
- [ ] Can login and receive token
- [ ] Token auto-saved to variables
- [ ] Can open account
- [ ] Can create securities (admin)
- [ ] Can place orders
- [ ] Can grant loans
- [ ] All folder 1-7 requests working

---

**Happy Testing! 🚀**

*Collection Version: 1.0*  
*Last Updated: December 2024*
