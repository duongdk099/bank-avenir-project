# New Features - Implementation Guide

## 📧 Email Confirmation Feature

### Overview
Users receive an email confirmation link upon registration. They must confirm their email before full account access.

### API Endpoints

#### 1. Register User (Updated)
**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+33612345678",
  "address": "123 Main St",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "dateOfBirth": "1990-01-01"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please check your email to confirm your account.",
  "userId": "uuid-here",
  "confirmationToken": "jwt-token-here"
}
```

**Note:** An email will be sent to the provided address with a confirmation link.

---

#### 2. Confirm Email (NEW)
**Endpoint:** `GET /auth/confirm/:token`

**Example:**
```
GET http://localhost:3000/auth/confirm/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "message": "Email confirmed successfully",
  "userId": "uuid-here"
}
```

**Already Confirmed Response (200):**
```json
{
  "message": "Email already confirmed",
  "userId": "uuid-here"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `400 Bad Request` - Invalid confirmation token type
- `400 Bad Request` - User not found

---

### Email Configuration

The email service uses Gmail SMTP with the following configuration:
- **Email:** duongvfe123@gmail.com
- **App Password:** vpkx zkfv ixzl jipv
- **Service:** Gmail SMTP

---

### Testing Email Confirmation

#### Option 1: Use Returned Token (Recommended for Testing)
```bash
# 1. Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Response includes confirmationToken

# 2. Confirm email using token
curl http://localhost:3000/auth/confirm/YOUR_TOKEN_HERE
```

#### Option 2: Check Email
Check the inbox of the registered email address for a confirmation email from "Banque AVENIR". Click the link in the email.

---

## 🔄 Conversation Transfer Feature

### Overview
Advisors can transfer client conversations to other advisors for specialized support or workload distribution.

### WebSocket Event

**Event Name:** `transfer_conversation`

**Namespace:** `/chat`

**Requirements:**
- Current user must be an advisor (ADMIN or MANAGER role)
- Current user must own the conversation
- Target advisor must have ADMIN or MANAGER role
- Cannot transfer to self

---

### Usage Examples

#### Using Socket.IO Client (JavaScript)

```javascript
import { io } from 'socket.io-client';

// Connect to chat namespace
const socket = io('http://localhost:3000/chat', {
  query: { userId: 'advisor-user-id' },
  transports: ['websocket']
});

// Transfer conversation
socket.emit('transfer_conversation', {
  conversationId: 'conversation-uuid',
  newAdvisorId: 'new-advisor-uuid',
  reason: 'Client requires technical support expertise'
}, (response) => {
  if (response.success) {
    console.log('Transfer successful:', response);
  } else {
    console.error('Transfer failed:', response.error);
  }
});

// Listen for incoming transfer
socket.on('conversation_transferred_to_you', (data) => {
  console.log('New conversation assigned:', data);
  // data.conversationId, data.clientId, data.clientName, data.fromAdvisor, data.reason
});

// Listen for advisor changes (client side)
socket.on('advisor_changed', (data) => {
  console.log('Your advisor has changed:', data);
  // data.newAdvisorName, data.previousAdvisorName, data.reason
});
```

---

#### Request Payload

```json
{
  "conversationId": "conversation-uuid",
  "newAdvisorId": "advisor-uuid",
  "reason": "Optional transfer reason"
}
```

---

#### Success Response

```json
{
  "success": true,
  "message": "Conversation transferred successfully to Jane Advisor",
  "conversationId": "conversation-uuid",
  "newAdvisorId": "advisor-uuid"
}
```

---

#### Error Responses

**Not Authenticated:**
```json
{
  "error": "User not authenticated"
}
```

**Not an Advisor:**
```json
{
  "error": "Only advisors can transfer conversations"
}
```

**Conversation Not Found:**
```json
{
  "error": "Conversation not found"
}
```

**Not Conversation Owner:**
```json
{
  "error": "You are not the owner of this conversation"
}
```

**Invalid Target Advisor:**
```json
{
  "error": "New advisor must have ADMIN or MANAGER role"
}
```

**Self-Transfer Attempt:**
```json
{
  "error": "Cannot transfer conversation to yourself"
}
```

---

### WebSocket Events Emitted

#### 1. `conversation_transferred_to_you` (to new advisor)
```json
{
  "conversationId": "uuid",
  "clientId": "uuid",
  "clientName": "Alice Client",
  "fromAdvisor": "John Advisor",
  "reason": "Transfer reason",
  "timestamp": "2025-12-15T15:30:00.000Z"
}
```

#### 2. `advisor_changed` (to client)
```json
{
  "conversationId": "uuid",
  "newAdvisorId": "uuid",
  "newAdvisorName": "Jane NewAdvisor",
  "previousAdvisorName": "John Advisor",
  "reason": "Transfer reason",
  "timestamp": "2025-12-15T15:30:00.000Z"
}
```

#### 3. `PRIVATE_MESSAGE_SENT` (system message)
A system message is added to the conversation documenting the transfer.

---

### Testing Conversation Transfer

#### Step-by-Step Test

1. **Create Test Users:**
```bash
# Create client
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"Test123!","firstName":"Alice","lastName":"Client"}'

# Create advisor 1
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"advisor1@test.com","password":"Test123!","firstName":"John","lastName":"Advisor"}'

# Create advisor 2
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"advisor2@test.com","password":"Test123!","firstName":"Jane","lastName":"NewAdvisor"}'
```

2. **Update Roles in Database:**
```sql
UPDATE users SET role = 'MANAGER' WHERE email = 'advisor1@test.com';
UPDATE users SET role = 'ADMIN' WHERE email = 'advisor2@test.com';
```

3. **Create Conversation:**
```sql
INSERT INTO private_conversations (id, user1_id, user2_id)
VALUES (
  'conv-uuid',
  'client-uuid',
  'advisor1-uuid'
);
```

4. **Connect via WebSocket and Transfer:**
```javascript
// Advisor 1 connects
const advisor1 = io('http://localhost:3000/chat', {
  query: { userId: 'advisor1-uuid' }
});

// Transfer conversation
advisor1.emit('transfer_conversation', {
  conversationId: 'conv-uuid',
  newAdvisorId: 'advisor2-uuid',
  reason: 'Specialized support needed'
});
```

5. **Verify in Database:**
```sql
SELECT user2_id FROM private_conversations WHERE id = 'conv-uuid';
-- Should now be advisor2-uuid
```

---

## 🧪 Unit Tests

### Running Tests

```bash
# Run all new feature tests
npm test -- test/unit/email.service.spec.ts test/unit/confirm-email.handler.spec.ts test/unit/chat-transfer.spec.ts

# Run specific test
npm test -- test/unit/email.service.spec.ts
```

### Test Coverage

✅ **Email Service Tests:**
- Email confirmation sending
- Savings rate notification sending
- Error handling
- SMTP connection

✅ **Email Confirmation Handler Tests:**
- Valid token confirmation
- Already confirmed check
- Invalid token rejection
- Expired token rejection
- Token type validation
- User not found handling

✅ **Conversation Transfer Tests:**
- Successful transfer
- Authentication validation
- Role validation
- Conversation ownership check
- Target advisor validation
- Self-transfer prevention

---

## 🌐 E2E Tests

### Running E2E Tests

```bash
# Run new features E2E tests
npm run test:e2e -- test/new-features.e2e-spec.ts
```

### Test Scenarios

✅ **Email Confirmation Flow:**
- User registration with token generation
- Email confirmation endpoint
- Duplicate email prevention
- Login after confirmation

✅ **Conversation Transfer Flow:**
- WebSocket connection
- Transfer between advisors
- Ownership verification
- Permission validation

✅ **Integration Tests:**
- Email confirmation + account creation
- Backwards compatibility

---

## 📦 Postman Collection Updates

### New Requests Added

1. **Confirm Email** (GET)
   - Path: `/auth/confirm/:token`
   - Folder: Authentication
   - Tests: Status validation, message verification

2. **Register Client User** (Updated)
   - Now saves `confirmationToken` to collection variable
   - Shows email notification message

### Collection Variables

- `confirmationToken` - Stored after registration

---

## 🔧 Implementation Files

### Email Confirmation
- `src/infrastructure/services/email.service.ts` - Email sending service
- `src/infrastructure/services/email.module.ts` - Email module
- `src/application/commands/confirm-email.command.ts` - Confirmation command
- `src/application/use-cases/confirm-email.handler.ts` - Confirmation handler
- `src/application/use-cases/register-user.handler.ts` - Updated with email sending
- `src/interface/http/controllers/auth.controller.ts` - Confirmation endpoint
- `src/application/user.module.ts` - Updated with email service

### Conversation Transfer
- `src/interface/websocket/chat.gateway.ts` - Transfer event handler (line 315+)

### Tests
- `test/unit/email.service.spec.ts` - Email service tests
- `test/unit/confirm-email.handler.spec.ts` - Confirmation handler tests
- `test/unit/chat-transfer.spec.ts` - Transfer feature tests
- `test/new-features.e2e-spec.ts` - E2E tests for both features

---

## 🚀 Deployment Checklist

- [x] Email service configured with Gmail credentials
- [x] Confirmation endpoint added to auth controller
- [x] Transfer event handler added to chat gateway
- [x] Unit tests created and passing
- [x] E2E tests created
- [x] Postman collection updated
- [x] Documentation created
- [ ] Environment variables configured (for production)
- [ ] Email templates reviewed
- [ ] WebSocket events tested in production-like environment

---

## 📝 Notes

### Email Service
- Currently configured for Gmail SMTP
- App password used for security
- Emails include styled HTML templates
- Confirmation links expire in 24 hours

### Conversation Transfer
- Only ADMIN and MANAGER roles can transfer
- System message logs all transfers
- Real-time notifications to all parties
- Database ownership updated atomically

### Security
- JWT tokens for email confirmation
- Role-based access control for transfers
- Conversation ownership validation
- Token expiration handling

---

## 🆘 Troubleshooting

### Email Not Sending
1. Check Gmail app password is correct
2. Verify "Less secure app access" is enabled (if needed)
3. Check SMTP connection in logs
4. Verify email address is valid

### Transfer Not Working
1. Verify both users have advisor roles
2. Check WebSocket connection is established
3. Confirm conversation exists in database
4. Verify current user owns conversation

### Tests Failing
1. Run `npm run build` first
2. Ensure database is clean
3. Check all dependencies installed
4. Verify TypeScript compilation successful

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Socket.IO Documentation](https://socket.io/)
- [NestJS WebSocket Guide](https://docs.nestjs.com/websockets/gateways)
- [JWT Best Practices](https://jwt.io/introduction)
