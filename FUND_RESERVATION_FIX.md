# Order Matching - Fund Reservation Fix

## Problem Summary

**Issue**: When placing BUY orders, funds were NOT deducted from the account balance immediately. This allowed users to place multiple orders exceeding their available balance.

**Example**:
- Account Balance: €1000
- Place BUY order: 10 shares @ €155 = €1550 + €1 fee = €1551 ❌
- Order Status: PENDING (should have been rejected)
- Balance after: €1000 (unchanged - **WRONG**)

## Solution Implemented

### Fund Reservation System

**When placing BUY orders**:
1. ✅ Validate sufficient funds: `quantity × price + €1 fee ≤ balance`
2. ✅ **Immediately deduct** reserved funds from account
3. ✅ If order executes at a **lower price**, refund the difference
4. ✅ If order is **cancelled**, refund full reserved amount

**When placing SELL orders**:
1. ✅ Validate sufficient holdings in portfolio
2. ✅ **Immediately deduct** securities from portfolio
3. ✅ If order executes, credit proceeds to account
4. ✅ If order is **cancelled**, restore securities to portfolio

---

## Test Scenarios

### Test 1: Insufficient Funds (Now Works Correctly)

**Setup**:
```bash
# Create investment account with €1000
curl -X POST http://localhost:3000/accounts/open \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountType\": \"INVESTMENT\",
    \"initialDeposit\": 1000
  }"
```

**Test: Try to buy beyond balance**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"BUY\",
    \"quantity\": 10,
    \"price\": 155
  }"
```

**Expected Result**:
```json
{
  "statusCode": 400,
  "message": "Insufficient funds. Required: €1551.00, Available: €1000.00",
  "error": "Bad Request"
}
```

**Balance**: Still €1000 ✅

---

### Test 2: Successful Fund Reservation

**Test: Place valid BUY order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"BUY\",
    \"quantity\": 5,
    \"price\": 155
  }"
```

**Expected Result**:
```json
{
  "message": "Order placed successfully",
  "orderId": "<ORDER_ID>",
  "matchesFound": 0
}
```

**Balance After**: €1000 - (5 × €155 + €1) = €1000 - €776 = **€224** ✅

**Verify Balance**:
```bash
curl http://localhost:3000/accounts/<ACCOUNT_ID>
```

---

### Test 3: Multiple Orders with Limited Funds

**Setup**: Account with €1000

**Step 1: Place first order**:
```bash
# BUY 5 shares @ €155 = €776
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"BUY\",
    \"quantity\": 5,
    \"price\": 155
  }"
```

**Balance After**: €1000 - €776 = **€224**

**Step 2: Try to place second order**:
```bash
# BUY 2 shares @ €155 = €311 (exceeds €224)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"BUY\",
    \"quantity\": 2,
    \"price\": 155
  }"
```

**Expected**: HTTP 400 - Insufficient funds ✅

---

### Test 4: Order Execution with Price Difference (Refund)

**Scenario**: BUY order placed at €155, matched with SELL order at €150

**Step 1: Place BUY order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_1>\",
    \"accountId\": \"<ACCOUNT_ID_1>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"BUY\",
    \"quantity\": 10,
    \"price\": 155
  }"
```

**Funds Reserved**: 10 × €155 + €1 = **€1551**

**Step 2: Place matching SELL order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID_2>\",
    \"accountId\": \"<ACCOUNT_ID_2>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"SELL\",
    \"quantity\": 10,
    \"price\": 150
  }"
```

**Execution**: Trades at €150 (seller's price)

**Buyer's Account**:
- Reserved: €1551
- Actual Cost: 10 × €150 + €1 = **€1501**
- **Refund**: €1551 - €1501 = **€50** ✅
- Net Deduction: €1501

**Seller's Account**:
- Credits: 10 × €150 - €1 = **€1499** ✅

---

### Test 5: Order Cancellation (Refund)

**Step 1: Place BUY order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"BUY\",
    \"quantity\": 5,
    \"price\": 100
  }"
```

**Response**:
```json
{
  "orderId": "<ORDER_ID>",
  "matchesFound": 0
}
```

**Balance After**: Original - (5 × €100 + €1) = **-€501**

**Step 2: Cancel the order**:
```bash
curl -X DELETE http://localhost:3000/orders/<ORDER_ID> \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"reason\": \"Changed my mind\"
  }"
```

**Expected Result**:
```json
{
  "message": "Order cancelled successfully",
  "success": true
}
```

**Balance After Cancellation**: Original balance restored (+€501) ✅

**Order Status**: CANCELLED

---

### Test 6: Insufficient Holdings (SELL order)

**Setup**: User has 5 shares of AAPL

**Test: Try to sell more than owned**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"SELL\",
    \"quantity\": 10,
    \"price\": 150
  }"
```

**Expected Result**:
```json
{
  "statusCode": 400,
  "message": "Insufficient securities. Required: 10, Available: 5",
  "error": "Bad Request"
}
```

**Portfolio**: Unchanged (still 5 shares) ✅

---

### Test 7: SELL Order with Reservation

**Setup**: User has 20 shares of AAPL

**Step 1: Place SELL order**:
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\",
    \"accountId\": \"<ACCOUNT_ID>\",
    \"securityId\": \"<SECURITY_ID>\",
    \"type\": \"SELL\",
    \"quantity\": 15,
    \"price\": 150
  }"
```

**Portfolio After**: 20 - 15 = **5 shares** (immediately deducted) ✅

**Step 2: Cancel SELL order**:
```bash
curl -X DELETE http://localhost:3000/orders/<ORDER_ID> \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"<USER_ID>\"
  }"
```

**Portfolio After Cancellation**: 5 + 15 = **20 shares** (restored) ✅

---

## Verification Queries

### Check Account Balance
```bash
curl http://localhost:3000/accounts/<ACCOUNT_ID>
```

### Check Pending Orders
```bash
curl http://localhost:3000/orders/user/<USER_ID>
```

### Check Portfolio Holdings
```sql
SELECT * FROM portfolios
WHERE account_id = '<ACCOUNT_ID>';
```

### Check Order Status
```bash
curl http://localhost:3000/orders/<ORDER_ID>
```

---

## Key Changes Made

### 1. `place-order.handler.ts`
```typescript
// BUY orders: Reserve funds immediately
if (command.type === 'BUY') {
  const totalCost = command.quantity * command.price + 1;
  if (account.balance.toNumber() < totalCost) {
    throw new BadRequestException(
      `Insufficient funds. Required: €${totalCost.toFixed(2)}, Available: €${account.balance.toNumber().toFixed(2)}`
    );
  }

  // DEDUCT FUNDS IMMEDIATELY
  await this.prisma.bankAccount.update({
    where: { id: command.accountId },
    data: { balance: { decrement: totalCost } },
  });
}

// SELL orders: Reserve securities immediately
if (command.type === 'SELL') {
  // DEDUCT HOLDINGS IMMEDIATELY
  await this.prisma.portfolio.update({
    where: { accountId_securityId: { ... } },
    data: { quantity: newQuantity },
  });
}
```

### 2. `investment-projector.ts` (OrderExecutedHandler)
```typescript
// Buyer: Already paid at order price, refund if execution price is lower
const actualBuyerCost = executedQuantity * executedPrice + fee;
const reservedBuyerCost = executedQuantity * buyOrder.price + fee;

if (reservedBuyerCost > actualBuyerCost) {
  const refund = reservedBuyerCost - actualBuyerCost;
  // REFUND DIFFERENCE
  await this.prisma.bankAccount.update({
    data: { balance: { increment: refund } },
  });
}

// Seller: Credit proceeds
const sellerProceeds = executedQuantity * executedPrice - fee;
await this.prisma.bankAccount.update({
  data: { balance: { increment: sellerProceeds } },
});
```

### 3. `investment-projector.ts` (OrderCancelledHandler)
```typescript
// Refund for BUY orders
if (order.type === 'BUY' && order.remainingQuantity > 0) {
  const refundAmount = order.remainingQuantity * order.price + 1;
  await this.prisma.bankAccount.update({
    data: { balance: { increment: refundAmount } },
  });
}

// Restore holdings for SELL orders
if (order.type === 'SELL' && order.remainingQuantity > 0) {
  await this.prisma.portfolio.update({
    data: { quantity: { increment: order.remainingQuantity } },
  });
}
```

### 4. New Endpoint: Cancel Order
```typescript
@Delete(':id')
async cancelOrder(@Param('id') id: string, @Body() dto: { userId: string }) {
  const command = new CancelOrderCommand(id, dto.userId);
  await this.commandBus.execute(command);
  return { message: 'Order cancelled successfully' };
}
```

---

## Summary

✅ **Fixed**: Funds are now reserved immediately when placing BUY orders  
✅ **Fixed**: Holdings are now reserved immediately when placing SELL orders  
✅ **Added**: Proper insufficient funds/holdings error messages  
✅ **Added**: Refund mechanism for execution price differences  
✅ **Added**: Full refund/restore on order cancellation  
✅ **Added**: New cancel order endpoint  

**Before**: Could place unlimited orders regardless of balance  
**After**: Each order immediately reserves required funds/holdings  

This brings the system in line with real-world trading platforms! 🎉
