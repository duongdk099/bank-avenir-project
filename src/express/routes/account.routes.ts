import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server-express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply authentication to all account routes
router.use(authenticate);

/**
 * GET /api/accounts
 * 
 * Get all accounts for authenticated user
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const accounts = await prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      accounts,
      count: accounts.length,
      framework: 'Express',
    });
  }),
);

/**
 * GET /api/accounts/:id
 * 
 * Get specific account details
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const account = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId, // Ensure user owns the account
      },
      include: {
        operations: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!account) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Account not found',
      });
    }

    res.json(account);
  }),
);

/**
 * POST /api/accounts/open
 * 
 * Open a new bank account
 * Uses IBAN generation service (shared with NestJS)
 */
router.post(
  '/open',
  [
    body('accountType').isIn(['CHECKING', 'SAVINGS', 'INVESTMENT']).withMessage('Invalid account type'),
    body('initialDeposit').optional().isFloat({ min: 0 }).withMessage('Invalid initial deposit'),
    body('name').optional().isString().withMessage('Name must be a string'),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.userId;
    const { accountType, initialDeposit = 0, name } = req.body;

    // Generate IBAN (simplified - in production use the IBAN service)
    // For now, using a simple counter-based approach
    const accountCount = await prisma.bankAccount.count();
    const accountNumber = (accountCount + 1).toString().padStart(11, '0');
    const bban = '12345' + '67890' + accountNumber + '86'; // Bank code + branch + account + key
    const iban = 'FR76' + bban;

    // Create account
    const accountId = uuidv4();
    const account = await prisma.bankAccount.create({
      data: {
        id: accountId,
        userId,
        iban,
        accountType,
        balance: initialDeposit,
        currency: 'EUR',
        status: 'ACTIVE',
        name,
      },
    });

    // Create initial deposit operation if amount > 0
    if (initialDeposit > 0) {
      await prisma.accountOperations.create({
        data: {
          id: uuidv4(),
          accountId,
          type: 'DEPOSIT',
          amount: initialDeposit,
          description: 'Initial deposit',
          balanceAfter: initialDeposit,
        },
      });
    }

    res.status(201).json({
      message: 'Account opened successfully',
      accountId: account.id,
      iban: account.iban,
      framework: 'Express',
    });
  }),
);

/**
 * POST /api/accounts/transfer
 * 
 * Transfer funds between accounts (internal transfers only)
 */
router.post(
  '/transfer',
  [
    body('fromAccountId').notEmpty().withMessage('Source account ID is required'),
    body('toIban').notEmpty().withMessage('Recipient IBAN is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('description').optional().isString(),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.userId;
    const { fromAccountId, toIban, amount, description = 'Transfer' } = req.body;

    // Verify source account ownership
    const fromAccount = await prisma.bankAccount.findFirst({
      where: {
        id: fromAccountId,
        userId,
      },
    });

    if (!fromAccount) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Source account not found',
      });
    }

    // Find destination account
    const toAccount = await prisma.bankAccount.findUnique({
      where: { iban: toIban },
    });

    if (!toAccount) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Recipient account not found',
      });
    }

    // Check balance
    if (fromAccount.balance.toNumber() < amount) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Insufficient funds',
      });
    }

    // Perform transfer (transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Debit source account
      const updatedFromAccount = await tx.bankAccount.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      // Credit destination account
      const updatedToAccount = await tx.bankAccount.update({
        where: { id: toAccount.id },
        data: { balance: { increment: amount } },
      });

      // Create operations
      const transferId = uuidv4();

      await tx.accountOperations.create({
        data: {
          id: uuidv4(),
          accountId: fromAccountId,
          type: 'TRANSFER',
          amount: -amount,
          description,
          recipientIban: toIban,
          balanceAfter: updatedFromAccount.balance,
        },
      });

      await tx.accountOperations.create({
        data: {
          id: uuidv4(),
          accountId: toAccount.id,
          type: 'TRANSFER',
          amount: amount,
          description,
          senderIban: fromAccount.iban,
          balanceAfter: updatedToAccount.balance,
        },
      });

      // Create transfer record
      await tx.transfer.create({
        data: {
          id: transferId,
          fromAccountId,
          toAccountId: toAccount.id,
          amount,
          description,
          reference: `TRF-${Date.now()}`,
          status: 'COMPLETED',
        },
      });

      return { updatedFromAccount, updatedToAccount, transferId };
    });

    res.json({
      message: 'Transfer completed successfully',
      transferId: result.transferId,
      newBalance: result.updatedFromAccount.balance.toNumber(),
      framework: 'Express',
    });
  }),
);

export default router;
