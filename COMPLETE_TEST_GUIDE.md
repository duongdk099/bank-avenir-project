# Complete API Test Guide
## Banking System with Order Matching Engine and Loan Amortization Calculator

This guide covers all endpoints including the newly implemented **Stock Market Order Matching Engine** and **Credit Amortization Calculator**.

---

## Prerequisites

1. **Start the Server**: `npm run start:dev`
2. **Server URL**: `http://localhost:3000`
3. **Test Flow**: Follow sections in order for proper data setup

---

## 1. User Registration and Authentication

### 1.1 Register First User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"john.doe@example.com\",
    \"password\": \"SecurePass123!\",
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"phone\": \"+33612345678\"
  }"
```

**Expected Response**:
```json
{
  "id": "<USER_ID_1>",
  "email": "john.doe@example.com"
}
```
**Save `USER_ID_1` for subsequent requests**

### 1.2 Register Second User (for transfers/trading)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"jane.smith@example.com\",
    \"password\": \"SecurePass456!\",
    \"firstName\": \"Jane\",
    \"lastName\": \"Smith\",
    \"phone\": \"+33687654321\"
  }"
```

**Save `USER_ID_2`**

### 1.3 Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"john.doe@example.com\",
    \"password\": \"SecurePass123!\"
  }"
```

**Expected Response**:
```json
{
  "access_token": "<JWT_TOKEN>"
}
```
**Save `JWT_TOKEN` - use in Authorization headers for protected routes**

---

## 2. Bank Account Management

### 2.1 Open Checking Account (User 1)
```bash
curl -X POST http://localhost:3000/accounts/open \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountType\": \"CHECKING\",
    \"initialDeposit\": 5000
  }"
```

**Expected Response**:
```json
{
  "id": "<ACCOUNT_ID_1>",
  "iban": "FR58 1234 5678 9000 0000 0000 100",
  "balance": "5000.00"
}
```
**Save `ACCOUNT_ID_1` and `IBAN_1`**

**IBAN Validation**: 
- Format: FR + 2-digit check (Modulo 97) + 23-digit BBAN
- Bank Code: 12345, Branch: 67890, Account: 11 digits

### 2.2 Open Investment Account (User 1)
```bash
curl -X POST http://localhost:3000/accounts/open \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountType\": \"INVESTMENT\",
    \"initialDeposit\": 10000
  }"
```

**Save `INVESTMENT_ACCOUNT_ID_1`**

### 2.3 Open Savings Account (User 2)
```bash
curl -X POST http://localhost:3000/accounts/open \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_2>\",
    \"accountType\": \"SAVINGS\",
    \"initialDeposit\": 3000
  }"
```

**Save `ACCOUNT_ID_2` and `IBAN_2`**

### 2.4 Get Account Details
```bash
curl http://localhost:3000/accounts/<ACCOUNT_ID_1>
```

### 2.5 Get User's Accounts
```bash
curl http://localhost:3000/accounts/user/<USER_ID_1>
```

---

## 3. Daily Interest Calculation (Savings Accounts)

**Automated Process**: Runs daily at 02:00 via cron job

### 3.1 Manual Interest Calculation Trigger
```bash
curl -X POST http://localhost:3000/accounts/interest/calculate
```

**Formula**:
```
Daily Interest = Balance × (Annual Rate / 365)
Annual Rate = 2.50% (0.0250)
```

**Example**: Balance €3000 → Daily Interest = €0.21

**Verification**: Check account balance after 24 hours or manual trigger

---

## 4. Stock Market Order Matching Engine

### 4.1 Prerequisites: Create Securities

First, insert test securities directly into the database:

```sql
-- Insert Apple stock
INSERT INTO securities (id, symbol, name, type, exchange, current_price, currency, last_updated)
VALUES (
  gen_random_uuid(),
  'AAPL',
  'Apple Inc.',
  'STOCK',
  'NASDAQ',
  150.00,
  'USD',
  NOW()
);

-- Insert Tesla stock
INSERT INTO securities (id, symbol, name, type, exchange, current_price, currency, last_updated)
VALUES (
  gen_random_uuid(),
  'TSLA',
  'Tesla Inc.',
  'STOCK',
  'NASDAQ',
  200.00,
  'USD',
  NOW()
);
```

**Get Security IDs**:
```sql
SELECT id, symbol FROM securities;
```
**Save `SECURITY_ID_AAPL` and `SECURITY_ID_TSLA`**

### 4.2 Place Buy Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountId\": \"<INVESTMENT_ACCOUNT_ID_1>\",
    \"securityId\": \"<SECURITY_ID_AAPL>\",
    \"type\": \"BUY\",
    \"quantity\": 10,
    \"price\": 155.00
  }"
```

**Validation**:
- Checks sufficient balance: `quantity × price + 1€ fee`
- Required: €155.00 × 10 + €1 = €1551

**Expected Response**:
```json
{
  "id": "<ORDER_ID_1>",
  "status": "PENDING",
  "type": "BUY",
  "quantity": 10,
  "price": "155.00"
}
```

### 4.3 Place Matching Sell Order (Triggers Execution)
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_2>\",
    \"accountId\": \"<ACCOUNT_ID_2>\",
    \"securityId\": \"<SECURITY_ID_AAPL>\",
    \"type\": \"SELL\",
    \"quantity\": 10,
    \"price\": 150.00
  }"
```

**Matching Logic**:
1. **Condition**: Buy Price (€155) ≥ Sell Price (€150) ✅
2. **Execution Price**: Sell price (€150) - benefits buyer
3. **Fee**: €1 fixed fee per trade (deducted from both sides)
4. **Portfolio Update**:
   - Buyer: +10 AAPL shares, -€1501 (€150×10 + €1 fee)
   - Seller: -10 AAPL shares, +€1499 (€150×10 - €1 fee)

**Expected Response**:
```json
{
  "id": "<ORDER_ID_2>",
  "status": "EXECUTED",
  "executedQuantity": 10,
  "matchedOrderId": "<ORDER_ID_1>"
}
```

### 4.4 View Order Book (All Pending Orders)
```bash
curl http://localhost:3000/orders/security/<SECURITY_ID_AAPL>/book
```

**Expected Response**:
```json
{
  "buyOrders": [
    {
      "price": "155.00",
      "quantity": 5,
      "createdAt": "2024-12-04T12:00:00Z"
    }
  ],
  "sellOrders": [
    {
      "price": "160.00",
      "quantity": 3,
      "createdAt": "2024-12-04T12:05:00Z"
    }
  ]
}
```

### 4.5 View User's Orders
```bash
curl http://localhost:3000/orders/user/<USER_ID_1>
```

### 4.6 View Account Trades
```bash
curl http://localhost:3000/orders/account/<INVESTMENT_ACCOUNT_ID_1>/trades
```

**Expected Response**:
```json
[
  {
    "id": "<TRADE_ID>",
    "buyOrderId": "<ORDER_ID_1>",
    "sellOrderId": "<ORDER_ID_2>",
    "quantity": 10,
    "price": "150.00",
    "commission": "1.00",
    "executedAt": "2024-12-04T12:10:00Z",
    "security": {
      "symbol": "AAPL",
      "name": "Apple Inc."
    }
  }
]
```

### 4.7 Test Partial Execution

**Place Large Buy Order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountId\": \"<INVESTMENT_ACCOUNT_ID_1>\",
    \"securityId\": \"<SECURITY_ID_TSLA>\",
    \"type\": \"BUY\",
    \"quantity\": 50,
    \"price\": 205.00
  }"
```

**Place Smaller Sell Order (Partial Match)**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_2>\",
    \"accountId\": \"<ACCOUNT_ID_2>\",
    \"securityId\": \"<SECURITY_ID_TSLA>\",
    \"type\": \"SELL\",
    \"quantity\": 20,
    \"price\": 200.00
  }"
```

**Result**:
- 20 shares executed immediately
- Buy order status: `PARTIALLY_FILLED` with 30 remaining
- Sell order status: `EXECUTED`

---

## 5. Credit Amortization Calculator

### 5.1 Grant Loan with Amortization Schedule
```bash
curl -X POST http://localhost:3000/loans/grant \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountId\": \"<ACCOUNT_ID_1>\",
    \"principal\": 10000,
    \"annualRate\": 0.05,
    \"insuranceRate\": 0.01,
    \"termMonths\": 12
  }"
```

**Mathematical Formula**:
```
Monthly Payment = P × [r / (1 - (1 + r)^(-n))]

Where:
- P = Principal (€10,000)
- r = Monthly Rate (5% / 12 = 0.004167)
- n = Term in months (12)

Calculation:
Monthly Payment = 10000 × [0.004167 / (1 - 1.004167^(-12))]
                = 10000 × 0.085607
                = €856.07

Insurance per month = (10000 × 0.01) / 12 = €8.33
Total Monthly Payment = €856.07 + €8.33 = €864.40
```

**Expected Response**:
```json
{
  "id": "<LOAN_ID>",
  "amount": "10000.00",
  "interestRate": "0.0500",
  "insuranceRate": "0.0100",
  "durationMonths": 12,
  "monthlyPayment": "864.40",
  "status": "ACTIVE",
  "scheduleGenerated": true
}
```

**Account Balance Update**: +€10,000 (loan credited immediately)

### 5.2 Get Loan Details
```bash
curl http://localhost:3000/loans/<LOAN_ID>
```

### 5.3 Get Amortization Schedule
```bash
curl http://localhost:3000/loans/<LOAN_ID>/schedule
```

**Expected Response (Sample for Month 1)**:
```json
[
  {
    "installmentNumber": 1,
    "principalAmount": "814.74",
    "interestAmount": "41.66",
    "insuranceAmount": "8.33",
    "totalAmount": "864.73",
    "dueDate": "2025-01-04T12:00:00Z",
    "isPaid": false
  },
  {
    "installmentNumber": 2,
    "principalAmount": "818.14",
    "interestAmount": "38.26",
    "insuranceAmount": "8.33",
    "totalAmount": "864.73",
    "dueDate": "2025-02-04T12:00:00Z",
    "isPaid": false
  }
  // ... 10 more months
]
```

**Key Properties**:
- **Constant Payment**: Total payment (€864.73) remains the same
- **Decreasing Interest**: Interest calculated on remaining balance
- **Increasing Principal**: More principal paid each month
- **Fixed Insurance**: Insurance amount constant (based on original principal)

**Formula Breakdown (Month 1)**:
```
Remaining Balance: €10,000
Interest: 10000 × 0.004167 = €41.66
Insurance: (10000 × 0.01) / 12 = €8.33
Principal: 856.07 - 41.66 = €814.74
New Balance: 10000 - 814.74 = €9,185.26
```

### 5.4 Get User's Loans
```bash
curl http://localhost:3000/loans/user/<USER_ID_1>
```

### 5.5 Calculate Payment for Different Parameters
```bash
curl -X POST http://localhost:3000/loans/calculate-payment \
  -H "Content-Type: application/json" \
  -d "{
    \"principal\": 25000,
    \"annualRate\": 0.04,
    \"insuranceRate\": 0.005,
    \"termMonths\": 36
  }"
```

**Expected Response**:
```json
{
  "principal": 25000,
  "monthlyPayment": "748.26",
  "totalInterest": "1937.36",
  "totalInsurance": "312.50",
  "totalRepayment": "27249.86"
}
```

### 5.6 Test Edge Cases

**Zero Interest Loan**:
```bash
curl -X POST http://localhost:3000/loans/grant \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountId\": \"<ACCOUNT_ID_1>\",
    \"principal\": 5000,
    \"annualRate\": 0.00,
    \"insuranceRate\": 0.005,
    \"termMonths\": 10
  }"
```

**Result**: Monthly Payment = €500 (principal only) + €2.08 (insurance)

---

## 6. Testing Workflows

### Workflow 1: Complete Investment Journey

1. **Setup**: Create 2 users with investment accounts (€10,000 each)
2. **User 1 Places Buy Order**: 100 shares @ €50
3. **User 2 Places Sell Order**: 100 shares @ €48
4. **Verify**:
   - Trade executed at €48 (seller's price)
   - User 1: -€4,801 (€48×100 + €1), +100 shares
   - User 2: +€4,799 (€48×100 - €1), -100 shares
5. **Check Portfolio**: Verify holdings updated correctly

### Workflow 2: Loan with Prepayment Simulation

1. **Grant Loan**: €20,000 @ 6% for 24 months
2. **Verify Initial Schedule**: Check month 1-24 payments
3. **Simulate Payment**: Manually update `isPaid` for month 1
4. **Calculate Early Payoff**: Use remaining balance for refinancing

### Workflow 3: Market Liquidity Test

1. **Place 5 Buy Orders**: Different prices (€100, €102, €105, €107, €110)
2. **Place 1 Large Sell Order**: 50 shares @ €103
3. **Verify**:
   - Matches with best buy prices first (€110, €107, €105)
   - Partial fills on lower-priced orders
   - Order book shows remaining unmatched orders

---

## 7. Validation Tests

### 7.1 Insufficient Funds (Buy Order)
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountId\": \"<INVESTMENT_ACCOUNT_ID_1>\",
    \"securityId\": \"<SECURITY_ID_AAPL>\",
    \"type\": \"BUY\",
    \"quantity\": 1000,
    \"price\": 200.00
  }"
```

**Expected**: HTTP 400 - "Insufficient funds"

### 7.2 Insufficient Holdings (Sell Order)
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_2>\",
    \"accountId\": \"<ACCOUNT_ID_2>\",
    \"securityId\": \"<SECURITY_ID_AAPL>\",
    \"type\": \"SELL\",
    \"quantity\": 100,
    \"price\": 150.00
  }"
```

**Expected**: HTTP 400 - "Insufficient holdings"

### 7.3 Invalid IBAN Transfer
```bash
curl -X POST http://localhost:3000/accounts/transfer \
  -H "Content-Type: application/json" \
  -d "{
    \"fromIban\": \"<IBAN_1>\",
    \"toIban\": \"INVALID_IBAN\",
    \"amount\": 100
  }"
```

**Expected**: HTTP 400 - "Invalid IBAN format"

---

## 8. Mathematical Verification

### 8.1 Verify IBAN Check Digits

**Formula**: Modulo 97 Algorithm
```
1. Move FR to end: [23-digit BBAN] + 1518 (F=15, R=27)
2. Calculate: Number mod 97
3. Check Digits: 98 - (result)
```

**Example**:
```
IBAN: FR58 1234 5678 9000 0000 0000 100
BBAN: 12345678900000000000100
Verification: 123456789000000000001001518 mod 97 = 40
Check: 98 - 40 = 58 ✅
```

### 8.2 Verify Loan Amortization

**Monthly Payment Calculation**:
```python
import math

def calculate_monthly_payment(principal, annual_rate, months):
    if annual_rate == 0:
        return principal / months
    
    monthly_rate = annual_rate / 12
    payment = principal * (monthly_rate / (1 - math.pow(1 + monthly_rate, -months)))
    return round(payment, 2)

# Test
principal = 10000
annual_rate = 0.05
months = 12

payment = calculate_monthly_payment(principal, annual_rate, months)
print(f"Monthly Payment: €{payment}")  # Should match API response
```

### 8.3 Verify Interest Calculation

**Daily Savings Interest**:
```python
def calculate_daily_interest(balance, annual_rate):
    daily_rate = annual_rate / 365
    interest = balance * daily_rate
    return round(interest, 2)

# Test
balance = 3000
annual_rate = 0.025

daily_interest = calculate_daily_interest(balance, annual_rate)
print(f"Daily Interest: €{daily_interest}")  # €0.21
```

---

## 9. Performance Testing

### 9.1 Concurrent Order Matching

Use tools like Apache Bench or Artillery:

```bash
# Install Artillery
npm install -g artillery

# Create test-orders.yml
cat > test-orders.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: Place Orders
    flow:
      - post:
          url: '/orders'
          json:
            userId: '<USER_ID_1>'
            accountId: '<INVESTMENT_ACCOUNT_ID_1>'
            securityId: '<SECURITY_ID_AAPL>'
            type: 'BUY'
            quantity: 1
            price: 150.00
EOF

# Run test
artillery run test-orders.yml
```

### 9.2 Database Query Performance

Check execution time for order matching queries:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE security_id = '<SECURITY_ID>'
  AND type = 'SELL'
  AND status = 'PENDING'
  AND remaining_quantity > 0
ORDER BY price ASC, created_at ASC
LIMIT 10;
```

---

## 10. Troubleshooting

### Issue: Orders Not Matching

**Check**:
1. **Price Condition**: Buy Price ≥ Sell Price
2. **Account Balances**: Sufficient funds/holdings
3. **Order Status**: Both orders `PENDING`
4. **Security ID**: Same security for both orders

**Debug SQL**:
```sql
SELECT id, type, price, remaining_quantity, status
FROM orders
WHERE security_id = '<SECURITY_ID>'
  AND status = 'PENDING'
ORDER BY created_at;
```

### Issue: Loan Schedule Not Generated

**Check**:
1. **Event Store**: Verify `LoanScheduleGeneratedEvent` created
   ```sql
   SELECT * FROM events
   WHERE aggregate_id = '<LOAN_ID>'
   ORDER BY version;
   ```

2. **Projector Execution**: Check logs for handler errors
3. **Database Entries**:
   ```sql
   SELECT COUNT(*) FROM loan_schedules
   WHERE loan_id = '<LOAN_ID>';
   ```

### Issue: IBAN Validation Failing

**Check**:
1. **Format**: 27 characters (FR + 2 digits + 23 digits)
2. **Check Digits**: Valid Modulo 97 calculation
3. **BBAN Structure**: 5-digit bank + 5-digit branch + 11-digit account + 2-digit key

---

## 11. Summary

This test guide covers:

✅ **Core Banking**: User registration, accounts, IBAN generation (Modulo 97)  
✅ **Interest Calculation**: Daily savings interest (2.5% annual)  
✅ **Order Matching Engine**: Buy/sell orders with price-time priority, €1 fee  
✅ **Loan Amortization**: Constant payment calculator with decreasing interest  
✅ **Validation**: Insufficient funds, invalid IBAN, holdings checks  
✅ **Mathematical Verification**: Formulas and edge cases

**Next Steps**:
- Implement order cancellation endpoint
- Add loan payment recording
- Create portfolio summary view
- Implement stop-loss/limit orders
- Add real-time order book WebSocket
