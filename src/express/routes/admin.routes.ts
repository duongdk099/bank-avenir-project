import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server-express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/admin/securities
 * 
 * Get all securities
 */
router.get(
  '/securities',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const securities = await prisma.security.findMany({
      orderBy: { symbol: 'asc' },
    });

    res.json({
      securities,
      count: securities.length,
      framework: 'Express',
    });
  }),
);

/**
 * POST /api/admin/securities
 * 
 * Create a new security (DIRECTOR only)
 */
router.post(
  '/securities',
  [
    body('symbol').notEmpty().withMessage('Symbol is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('type').notEmpty().withMessage('Type is required'),
    body('currentPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symbol, name, type, exchange, currentPrice, currency = 'EUR' } = req.body;

    const security = await prisma.security.create({
      data: {
        id: uuidv4(),
        symbol: symbol.toUpperCase(),
        name,
        type,
        exchange,
        currentPrice,
        currency,
        lastUpdated: new Date(),
        isAvailable: true,
      },
    });

    res.status(201).json({
      message: 'Security created successfully',
      security,
      framework: 'Express',
    });
  }),
);

/**
 * PUT /api/admin/securities/:id/availability
 * 
 * Update security availability
 */
router.put(
  '/securities/:id/availability',
  [
    body('isAvailable').isBoolean().withMessage('isAvailable must be boolean'),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { isAvailable } = req.body;

    const security = await prisma.security.update({
      where: { id },
      data: {
        isAvailable,
        lastUpdated: new Date(),
      },
    });

    res.json({
      message: 'Security availability updated',
      security,
      framework: 'Express',
    });
  }),
);

/**
 * POST /api/admin/savings-rate
 * 
 * Update savings interest rate (DIRECTOR only)
 */
router.post(
  '/savings-rate',
  [
    body('rate').isFloat({ min: 0, max: 1 }).withMessage('Rate must be between 0 and 1'),
    body('minBalance').optional().isFloat({ min: 0 }),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rate, minBalance = 0 } = req.body;

    const savingsRate = await prisma.savingsRate.create({
      data: {
        id: uuidv4(),
        accountType: 'SAVINGS',
        rate,
        minBalance,
        effectiveDate: new Date(),
      },
    });

    // Note: In a real implementation, this would trigger notifications
    // to all savings account holders via Event Bus

    res.status(201).json({
      message: 'Savings rate updated successfully',
      rate: savingsRate,
      framework: 'Express',
    });
  }),
);

/**
 * GET /api/admin/users
 * 
 * Get all users
 */
router.get(
  '/users',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      users,
      count: users.length,
      framework: 'Express',
    });
  }),
);

/**
 * GET /api/admin/stats
 * 
 * Get platform statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const [userCount, accountCount, loanCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.bankAccount.count(),
      prisma.loan.count(),
      prisma.order.count(),
    ]);

    const accountsSum = await prisma.bankAccount.aggregate({
      _sum: { balance: true },
    });

    res.json({
      stats: {
        users: userCount,
        accounts: accountCount,
        loans: loanCount,
        orders: orderCount,
        totalBalance: accountsSum._sum.balance?.toNumber() || 0,
      },
      framework: 'Express',
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
