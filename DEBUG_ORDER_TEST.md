# Quick Debug Test for Order Placement Issue

## Understanding the System

**IMPORTANT**: The system works in 2 stages:

### Stage 1: Order Placement (PENDING)
- Money is **immediately deducted** (reserved)
- Order status = **PENDING**
- **NO stocks in portfolio yet** (this is correct!)
- You wait for a matching order

### Stage 2: Order Execution (EXECUTED)
- A matching SELL order arrives
- Trade executes
- Order status = **EXECUTED**
- **Stocks added to portfolio**
- Any price difference refunded

## Your Test Scenario

Based on your description:
- Account Balance: €1000
- Try to BUY: 10 shares @ €155 = €1550 + €1 fee = **€1551 total**
- Result: Order shows PENDING (WRONG - should be rejected!)

## Debug Steps

### Step 1: Check your actual account balance

```bash
curl http://localhost:3000/accounts/<YOUR_ACCOUNT_ID>
```

**Look for the `balance` field**. Make sure it's actually €1000.

### Step 2: Try placing the invalid order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<YOUR_USER_ID>",
    "accountId": "<YOUR_ACCOUNT_ID>",
    "securityId": "<SECURITY_ID>",
    "type": "BUY",
    "quantity": 10,
    "price": 155
  }'
```

**Check the terminal logs** for output like:
```
[PlaceOrderHandler] BUY Order Validation:
  Required: €1551.00
  Available: €1000.00
  Sufficient: false
```

**Expected Response**:
```json
{
  "statusCode": 400,
  "message": "Insufficient funds. Required: €1551.00, Available: €1000.00",
  "error": "Bad Request"
}
```

**If you get status 200** - there's a bug!

### Step 3: Try placing a valid order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<YOUR_USER_ID>",
    "accountId": "<YOUR_ACCOUNT_ID>",
    "securityId": "<SECURITY_ID>",
    "type": "BUY",
    "quantity": 5,
    "price": 155
  }'
```

**Cost**: 5 × €155 + €1 = €776

**Check terminal logs**:
```
[PlaceOrderHandler] BUY Order Validation:
  Required: €776.00
  Available: €1000.00
  Sufficient: true
[PlaceOrderHandler] Reserved €776.00 from account
[OrderMatchingService] Found 0 potential matches for order...
```

**Expected Response**:
```json
{
  "message": "Order placed successfully",
  "orderId": "<ORDER_ID>",
  "matchesFound": 0
}
```

### Step 4: Check account balance after valid order

```bash
curl http://localhost:3000/accounts/<YOUR_ACCOUNT_ID>
```

**Expected**: Balance = €1000 - €776 = **€224.00**

### Step 5: Check your portfolio

```bash
# Option 1: Check database directly
```

**Expected for PENDING order**: 
- Portfolio shows **0 shares** (correct!)
- Order status = PENDING
- Money = €224 (€776 reserved)

**This is NORMAL behavior** - you only get stocks when order is EXECUTED!

### Step 6: Cancel the pending order to get money back

```bash
curl -X DELETE http://localhost:3000/orders/<ORDER_ID> \
  -H "Content-Type: application/json" \
  -d '{"userId": "<YOUR_USER_ID>"}'
```

**Expected**:
- Order status = CANCELLED
- Balance = €1000 (money refunded!)

## If You Want to Actually Execute an Order

To see stocks in your portfolio, you need a matching SELL order:

### Create a second account with stocks

```bash
# 1. Register second user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "Pass123!",
    "firstName": "Seller",
    "lastName": "User"
  }'

# 2. Open investment account
curl -X POST http://localhost:3000/accounts/open \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<SELLER_USER_ID>",
    "accountType": "INVESTMENT",
    "initialDeposit": 5000
  }'

# 3. Manually add stocks to their portfolio (using database)
```

**SQL to add stocks**:
```sql
INSERT INTO portfolios (id, account_id, security_id, quantity, avg_purchase_price, total_cost)
VALUES (
  gen_random_uuid(),
  '<SELLER_ACCOUNT_ID>',
  '<SECURITY_ID>',
  100,
  100.00,
  10000.00
);
```

### Now place matching orders

**Buyer places BUY order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<BUYER_USER_ID>",
    "accountId": "<BUYER_ACCOUNT_ID>",
    "securityId": "<SECURITY_ID>",
    "type": "BUY",
    "quantity": 10,
    "price": 155
  }'
```

**Seller places SELL order** (will match immediately):
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<SELLER_USER_ID>",
    "accountId": "<SELLER_ACCOUNT_ID>",
    "securityId": "<SECURITY_ID>",
    "type": "SELL",
    "quantity": 10,
    "price": 150
  }'
```

**Result**:
- Trade executes at €150 (seller's price)
- Buyer: -€1501 (€150×10 + €1), +10 shares ✅
- Buyer refunded: €51 (paid for €155 but executed at €150)
- Seller: +€1499 (€150×10 - €1), -10 shares ✅
- Both orders status = EXECUTED

## Common Misunderstandings

❌ **WRONG**: "I placed a BUY order but have 0 stocks"
✅ **CORRECT**: PENDING orders don't give you stocks yet - only EXECUTED orders do!

❌ **WRONG**: "My money is gone but I have nothing"
✅ **CORRECT**: Money is **reserved** (locked) for your pending order. Cancel to get it back!

❌ **WRONG**: "The system should give me stocks immediately when I buy"
✅ **CORRECT**: This is a **matching engine** - you need someone to SELL to you!

## Real Bug to Check

The only real bug is if:
1. You place order with **insufficient funds** (€1551 when you have €1000)
2. System accepts it and shows PENDING (should reject with 400 error)

If this happens, **check the terminal logs** and send me the output!
