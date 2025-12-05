# 🧪 Complete API Testing Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Test Scenarios](#test-scenarios)
4. [WebSocket Testing](#websocket-testing)
5. [SSE Testing](#sse-testing)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### 1. Start the Application
```powershell
cd "c:\Users\barry\Documents\study\bank-project-school\version 0"
npm run start:dev
```

### 2. Verify Database Connection
```powershell
npx prisma studio
# Opens at http://localhost:5555
```

### 3. Import Postman Collection
- Open Postman
- Click **Import** → Select `postman-collection.json`
- Collection will appear as "Bank Project - Complete API Collection"

### 4. Configure Environment Variables
In Postman, create an environment or use collection variables:
- `baseUrl`: `http://localhost:3000`
- `accessToken`: (auto-set after login)
- `userId`: (auto-set after registration)
- `accountId`: (auto-set after account creation)

---

## 🚀 Quick Start - Full Flow Test

### Step 1: Authentication (Folder 1)
Execute in order:

1. **Register Client User**
   - Creates a CLIENT role user
   - Saves `userId` to collection variables
   - ✅ Expected: `201 Created` or `200 OK`

2. **Register Manager User** (Optional)
   - Creates a MANAGER role user for admin operations
   - ✅ Expected: `201 Created`

3. **Login Client**
   - Authenticates and returns JWT token
   - Automatically saves `accessToken` to collection variables
   - ✅ Expected: `200 OK` with `{ accessToken, user }`

### Step 2: Create Account (Folder 2)
Execute in order:

1. **Open Checking Account**
   - Creates CHECKING account with $10,000 initial deposit
   - Saves `accountId` to collection variables
   - ✅ Expected: `200 OK` with `{ accountId, iban }`

2. **Get User Accounts**
   - Verify account was created
   - ✅ Expected: Array with 1 account, balance = 10000

### Step 3: Create Securities (Folder 3 - Admin)
**Note:** May need to update user role to ADMIN first

1. **Create Security - AAPL**
   - Creates Apple stock
   - Saves `securityId` to collection variables
   - ✅ Expected: `200 OK` with security object

2. **Create Security - TSLA**
   - Creates Tesla stock
   - ✅ Expected: `200 OK`

3. **Get All Securities**
   - Verify securities exist
   - ✅ Expected: Array with 2 securities

### Step 4: Trading (Folder 4)

1. **Place Buy Order - AAPL**
   - Buy 10 shares at $180.50
   - Total cost: $1,805.00
   - Saves `orderId` to collection variables
   - ✅ Expected: `200 OK`
   - ✅ Account balance should decrease by $1,805.00 immediately

2. **Get User Orders**
   - Check order status
   - ✅ Expected: Order with status `PENDING` (waiting for matching)

3. **Get Order Book**
   - View buy/sell orders for AAPL
   - ✅ Expected: Buy orders array with your order

4. **Cancel Order** (Optional)
   - Cancel the pending order
   - ✅ Expected: `200 OK`
   - ✅ Funds should be refunded to account

### Step 5: Loans (Folder 5)

1. **Grant Loan**
   - Request $25,000 loan at 5.5% APR for 36 months
   - Saves `loanId` to collection variables
   - ✅ Expected: `200 OK` with loan details
   - ✅ Account balance should increase by $25,000

2. **Get Loan Schedule**
   - View amortization schedule
   - ✅ Expected: Array of 36 installments with payment breakdown

3. **Get User Loans**
   - List all user loans
   - ✅ Expected: Array with 1 loan, status `ACTIVE`

---

## 📊 Detailed Test Scenarios

### Scenario 1: Complete Buy Order Flow

**Objective:** Test full order lifecycle from placement to execution

```
Initial State:
- Account balance: $10,000
- Portfolio: Empty

Steps:
1. Create Security (AAPL @ $180.50)
2. Place Buy Order: 10 shares @ $180.50
   - Verify: Balance = $10,000 - $1,805 = $8,195
   - Verify: Order status = PENDING
   - Verify: Reserved funds = $1,805

3. Place Matching Sell Order (from another user)
   - Create second user and account
   - Give them AAPL shares (insert into portfolios table)
   - Place Sell Order: 10 shares @ $180.50

4. Check Trades
   - GET /orders/account/{accountId}/trades
   - Verify: Trade executed at $180.50
   - Verify: Portfolio has 10 AAPL shares

5. Check Final Balance
   - Verify: No funds returned (exact match)
   - If sell was cheaper: Refund = (orderPrice - executedPrice) * quantity
```

### Scenario 2: Insufficient Funds Test

**Objective:** Verify order rejection when insufficient balance

```
Steps:
1. Check current balance
2. Place Buy Order for amount > balance
   - Example: Balance = $8,195, try to buy 100 shares @ $180.50 = $18,050
3. Expected: Order rejected with error message
4. Expected: Balance unchanged
```

### Scenario 3: Sell Without Holdings Test

**Objective:** Verify sell order rejection without securities

```
Steps:
1. Check portfolio (should be empty or insufficient)
2. Place Sell Order: 10 shares of TSLA
3. Expected: Order rejected - "Insufficient securities"
4. Expected: Portfolio unchanged
```

### Scenario 4: Interest Calculation Test

**Objective:** Verify savings account interest

```
Steps:
1. Open Savings Account with $50,000
2. Create Savings Rate (3.5% APR, min $1,000)
   - POST /admin/savings-rate
3. Calculate Interest
   - POST /accounts/interest/calculate
4. Expected: Interest credited to account
5. Calculation: $50,000 * (0.035 / 365) * days
6. Verify: Account operations table has INTEREST_CREDIT entry
```

### Scenario 5: Loan Payment Schedule Test

**Objective:** Verify loan amortization calculation

```
Steps:
1. Calculate Payment Preview
   - POST /loans/calculate-payment/preview
   - Body: { principal: 50000, annualRate: 0.045, termMonths: 60, insuranceRate: 0.015 }
2. Grant Loan
   - POST /loans/grant (same parameters)
3. Get Loan Schedule
   - GET /loans/{loanId}/schedule
4. Verify:
   - 60 installments
   - Each installment: principal + interest + insurance
   - Total interest decreases over time (amortization)
   - Principal payment increases over time
   - Last installment balance = 0
```

---

## 🔌 WebSocket Testing

### Using test-chat.html

1. **Start Server**
   ```powershell
   npm run start:dev
   ```

2. **Open Test Page**
   - Open `test-chat.html` in browser
   - Or navigate to: `file:///c:/Users/barry/Documents/study/bank-project-school/version%200/test-chat.html`

3. **Test Client → Advisor Flow**

   **Window 1 (Client):**
   ```
   1. Enter userId: "user-001" (or actual user ID)
   2. Click "Connect"
   3. Enter help message: "I need help with my investment account"
   4. Click "Request Help"
   5. Wait for advisor to accept
   6. When accepted, you'll see: "✅ Advisor {name} accepted your help request"
   7. Send messages using "Send Private Message"
   ```

   **Window 2 (Advisor):**
   ```
   1. Enter userId: "manager-001" (MANAGER role user)
   2. Click "Connect"
   3. You'll see: "🆘 Help request from user user-001: {message}"
   4. Copy conversationId from notification
   5. Paste into "Conversation ID" field
   6. Click "Accept Help Request"
   7. You'll see: "✅ Help request accepted. Now assisting user user-001"
   8. Send messages back to client
   ```

### WebSocket Events Reference

**Client → Server:**
```javascript
// Send private message
socket.emit('private_message', {
  receiverId: 'user-002',
  content: 'Hello!'
}, (response) => {
  console.log(response.success, response.conversationId);
});

// Request help
socket.emit('request_help', {
  message: 'I need assistance'
}, (response) => {
  console.log(response.conversationId);
});

// Accept help (advisor only)
socket.emit('accept_help', {
  conversationId: 'conv-xxx'
}, (response) => {
  console.log(response.clientId);
});

// Mark messages as read
socket.emit('mark_read', {
  conversationId: 'conv-xxx'
});
```

**Server → Client:**
```javascript
// New message received
socket.on('new_message', (data) => {
  console.log(data.senderName, data.content);
});

// Help request broadcast (advisors only)
socket.on('help_request', (data) => {
  console.log(data.userId, data.message, data.conversationId);
});

// Help accepted (client)
socket.on('help_accepted', (data) => {
  console.log(data.advisorName);
});

// Request taken by another advisor
socket.on('request_taken', (data) => {
  console.log(data.conversationId);
});
```

---

## 📡 SSE (Server-Sent Events) Testing

### Method 1: Browser Console

```javascript
// Open browser console (F12)
const eventSource = new EventSource('http://localhost:3000/sse/notifications?userId=your-user-id');

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('📬 Notification:', notification);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};

// To close connection
eventSource.close();
```

### Method 2: cURL
```powershell
curl -N "http://localhost:3000/sse/notifications?userId=your-user-id"
```

### Method 3: Create HTML Test Page

```html
<!DOCTYPE html>
<html>
<head><title>SSE Test</title></head>
<body>
  <h1>Real-time Notifications</h1>
  <div id="notifications"></div>
  
  <script>
    const userId = 'your-user-id'; // Replace with actual user ID
    const eventSource = new EventSource(`http://localhost:3000/sse/notifications?userId=${userId}`);
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      const div = document.createElement('div');
      div.innerHTML = `
        <strong>${notification.type}</strong>: ${notification.message}
        <br><small>${new Date(notification.createdAt).toLocaleString()}</small>
        <hr>
      `;
      document.getElementById('notifications').prepend(div);
    };
  </script>
</body>
</html>
```

### Trigger SSE Notifications

**Test Events:**

1. **ORDER_EXECUTED**
   - Place matching buy/sell orders
   - Expected SSE: `{ type: 'ORDER_EXECUTED', message: 'Your order for AAPL has been executed...' }`

2. **LOAN_GRANTED**
   - POST /loans/grant
   - Expected SSE: `{ type: 'LOAN_GRANTED', message: 'Your loan of $25,000 has been approved' }`

3. **SAVINGS_RATE_CHANGED**
   - POST /admin/savings-rate
   - Expected SSE: `{ type: 'SAVINGS_RATE_CHANGED', message: 'Savings rate updated...' }`

4. **PRIVATE_MESSAGE_SENT**
   - Send WebSocket message
   - Expected SSE: `{ type: 'PRIVATE_MESSAGE_SENT', message: 'New message from {sender}' }`

5. **ACCOUNT_CREDITED**
   - Grant loan (deposits funds)
   - Expected SSE: `{ type: 'ACCOUNT_CREDITED', message: 'Your account has been credited $25,000' }`

6. **ACCOUNT_DEBITED**
   - Place buy order
   - Expected SSE: `{ type: 'ACCOUNT_DEBITED', message: 'Your account has been debited $1,805' }`

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **401 Unauthorized**
```
Problem: "Unauthorized" on protected endpoints
Solution: 
- Ensure you've run "Login Client" request
- Check that accessToken is saved to collection variables
- Verify Authorization header: Bearer {{accessToken}}
```

#### 2. **JWT Token Expired**
```
Problem: Token expired (default 1 hour)
Solution:
- Re-run "Login Client" to get new token
- Token automatically saves to {{accessToken}}
```

#### 3. **User Not Found / Invalid User**
```
Problem: 404 or "User not found" errors
Solution:
- Run "Register Client User" first
- Check that {{userId}} variable is set
- Verify user exists: GET /admin/users
```

#### 4. **Account Not Found**
```
Problem: "Account not found" when placing orders
Solution:
- Run "Open Checking Account" first
- Check that {{accountId}} variable is set
- Verify: GET /accounts/user/{{userId}}
```

#### 5. **Security Not Found**
```
Problem: "Security not found" when placing orders
Solution:
- Run "Create Security - AAPL" first
- Check that {{securityId}} variable is set
- Verify: GET /admin/securities
```

#### 6. **Insufficient Funds**
```
Problem: Order rejected - insufficient balance
Solution:
- Check account balance: GET /accounts/{{accountId}}
- Ensure initial deposit was made
- Order cost = quantity * price (e.g., 10 * 180.50 = $1,805)
```

#### 7. **Insufficient Securities (Sell Order)**
```
Problem: Cannot place sell order - no securities
Solution:
- Buy securities first with a buy order
- Wait for order to execute (need matching sell order)
- Or manually insert into portfolios table via Prisma Studio
- SQL: INSERT INTO portfolios (id, account_id, security_id, quantity, avg_purchase_price, total_cost, updated_at)
       VALUES (uuid(), 'account-id', 'security-id', 10, 180.50, 1805.00, NOW());
```

#### 8. **WebSocket Connection Failed**
```
Problem: Cannot connect to WebSocket
Solution:
- Ensure server is running: npm run start:dev
- Check server logs for WebSocket initialization
- Verify port 3000 is not blocked by firewall
- Use correct URL: ws://localhost:3000/chat
```

#### 9. **SSE Not Receiving Events**
```
Problem: EventSource connected but no notifications
Solution:
- Verify userId is correct
- Trigger an event (place order, grant loan)
- Check server logs for event publishing
- Ensure SSE endpoint returns Content-Type: text/event-stream
```

#### 10. **Role Permission Denied**
```
Problem: 403 Forbidden on admin endpoints
Solution:
- Admin endpoints require ADMIN role
- Update user role: PUT /admin/users/{userId}/role
- Body: { "role": "ADMIN" }
- Or manually update in database
```

---

## 📝 Testing Checklist

### ✅ Authentication
- [ ] Register user successfully
- [ ] Login and receive JWT token
- [ ] Access protected endpoint with token
- [ ] Token auto-saves to collection variables

### ✅ Accounts
- [ ] Open checking account with initial deposit
- [ ] Open savings account
- [ ] Get account by ID
- [ ] Get all user accounts
- [ ] Verify balance after operations

### ✅ Admin Operations
- [ ] Create securities (AAPL, TSLA)
- [ ] Update security price
- [ ] Create savings rate
- [ ] View all users
- [ ] Update user role
- [ ] View dashboard stats

### ✅ Trading
- [ ] Place buy order (funds reserved immediately)
- [ ] Place sell order (securities reserved)
- [ ] Get order by ID
- [ ] View order book
- [ ] Cancel pending order (refund issued)
- [ ] View executed trades

### ✅ Loans
- [ ] Calculate loan payment preview
- [ ] Grant loan (funds credited)
- [ ] Get loan schedule (amortization table)
- [ ] View all user loans

### ✅ Chat & Messaging
- [ ] Get conversations list
- [ ] Get messages in conversation
- [ ] Get unread message count
- [ ] WebSocket: Send private message
- [ ] WebSocket: Request help
- [ ] WebSocket: Advisor accepts help
- [ ] WebSocket: Real-time message delivery

### ✅ Notifications
- [ ] Get all notifications
- [ ] Get unread notifications only
- [ ] Get unread count
- [ ] Mark single notification as read
- [ ] Mark all as read
- [ ] SSE: Receive real-time notifications

### ✅ Real-Time Features
- [ ] WebSocket connection established
- [ ] Chat messages sent and received
- [ ] Advisor assignment works correctly
- [ ] SSE stream receives order events
- [ ] SSE stream receives loan events
- [ ] SSE stream receives message events

---

## 📊 Expected Database State After Full Test

### Users Table
- 2 users (CLIENT, MANAGER)

### BankAccounts Table
- 2+ accounts (CHECKING, SAVINGS)
- Balance reflects all operations

### Securities Table
- 2 securities (AAPL, TSLA)

### Orders Table
- Multiple orders (BUY, SELL)
- Status: PENDING, EXECUTED, or CANCELLED

### Trades Table
- Executed trades (if matching orders placed)

### Loans Table
- 1+ loans (status: ACTIVE)

### LoanSchedule Table
- 36 installment records (for 3-year loan)

### PrivateConversations Table
- Conversations created via WebSocket

### PrivateMessages Table
- Messages exchanged via chat

### Notifications Table
- All triggered events stored

---

## 🎯 Performance Testing

### Load Testing with Artillery
```powershell
npm install -g artillery

# Create artillery.yml
artillery quick --count 10 --num 50 http://localhost:3000/accounts/user/user-id
```

### Stress Test Scenarios
1. **Concurrent Orders**: 100 simultaneous buy orders
2. **WebSocket Load**: 50 concurrent chat connections
3. **SSE Load**: 100 simultaneous SSE connections
4. **Database Load**: 1000 order book queries

---

## 📚 Additional Resources

- **Swagger/OpenAPI**: Not configured (can add if needed)
- **Prisma Studio**: `npx prisma studio` (database GUI)
- **Server Logs**: Check terminal for request/response logs
- **Database**: PostgreSQL at connection string in .env

---

## 🎉 Success Criteria

Your API is working correctly if:

1. ✅ All authentication requests return tokens
2. ✅ Accounts are created with correct balances
3. ✅ Orders reserve funds/securities immediately
4. ✅ Order matching executes trades correctly
5. ✅ Loans credit accounts and generate schedules
6. ✅ WebSocket chat delivers messages in real-time
7. ✅ SSE notifications stream for all events
8. ✅ Role-based access control blocks unauthorized users
9. ✅ Cancelling orders refunds reserved amounts
10. ✅ Interest calculation updates account balances

**Happy Testing! 🚀**
