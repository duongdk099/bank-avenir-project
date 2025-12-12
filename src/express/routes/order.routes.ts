import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server-express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply authentication to all order routes
router.use(authenticate);

/**
 * POST /api/orders/place
 * 
 * Place a buy or sell order
 */
router.post(
  '/place',
  [
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('securityId').notEmpty().withMessage('Security ID is required'),
    body('type').isIn(['BUY', 'SELL']).withMessage('Type must be BUY or SELL'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.userId;
    const { accountId, securityId, type, quantity, price } = req.body;

    // Verify account ownership
    const account = await prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Account not found',
      });
    }

    // Verify security exists and is available
    const security = await prisma.security.findUnique({
      where: { id: securityId },
    });

    if (!security || !security.isAvailable) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Security not available for trading',
      });
    }

    // For BUY orders, check if user has sufficient funds (including €1 fee)
    if (type === 'BUY') {
      const totalCost = quantity * price + 1; // €1 fee
      if (account.balance.toNumber() < totalCost) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Insufficient funds',
          required: totalCost,
          available: account.balance.toNumber(),
        });
      }
    }

    // For SELL orders, check if user has sufficient shares
    if (type === 'SELL') {
      const portfolio = await prisma.portfolio.findUnique({
        where: {
          accountId_securityId: {
            accountId,
            securityId,
          },
        },
      });

      if (!portfolio || portfolio.quantity < quantity) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Insufficient shares',
          requested: quantity,
          available: portfolio?.quantity || 0,
        });
      }
    }

    // Create order
    const orderId = uuidv4();
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId,
        accountId,
        securityId,
        type,
        quantity,
        remainingQuantity: quantity,
        price,
        status: 'PENDING',
      },
    });

    // Note: In a real implementation, this would trigger the order matching engine
    // via Event Bus or message queue

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order.id,
      status: order.status,
      framework: 'Express',
    });
  }),
);

/**
 * GET /api/orders/user/:userId
 * 
 * Get all orders for a user
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    // Verify user is requesting their own orders or is admin
    if (req.user!.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot access other users orders',
      });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        security: true,
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      orders,
      count: orders.length,
      framework: 'Express',
    });
  }),
);

/**
 * GET /api/orders/:id
 * 
 * Get specific order details
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        security: true,
        account: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
      });
    }

    // Verify ownership
    if (order.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot access this order',
      });
    }

    res.json({ order, framework: 'Express' });
  }),
);

export default router;
