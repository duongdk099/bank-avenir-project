import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server-express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply authentication and manager authorization
router.use(authenticate);
router.use(authorize('MANAGER', 'ADMIN'));

/**
 * POST /api/loans/grant
 * 
 * Grant a loan to a user (MANAGER/ADVISOR only)
 */
router.post(
  '/grant',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('principal').isFloat({ min: 100 }).withMessage('Principal must be at least 100'),
    body('annualRate').isFloat({ min: 0, max: 1 }).withMessage('Annual rate must be between 0 and 1'),
    body('termMonths').isInt({ min: 1, max: 360 }).withMessage('Term must be between 1 and 360 months'),
    body('insuranceRate').isFloat({ min: 0, max: 1 }).withMessage('Insurance rate must be between 0 and 1'),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, accountId, principal, annualRate, termMonths, insuranceRate } = req.body;

    // Verify account exists and belongs to user
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

    // Calculate monthly payment (constant payment method)
    const monthlyRate = annualRate / 12;
    let monthlyPaymentWithoutInsurance: number;

    if (monthlyRate === 0) {
      monthlyPaymentWithoutInsurance = principal / termMonths;
    } else {
      monthlyPaymentWithoutInsurance =
        (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    }

    const monthlyInsurance = (principal * insuranceRate) / termMonths;
    const totalMonthlyPayment = monthlyPaymentWithoutInsurance + monthlyInsurance;

    // Create loan
    const loanId = uuidv4();
    const loan = await prisma.loan.create({
      data: {
        id: loanId,
        userId,
        accountId,
        amount: principal,
        interestRate: annualRate,
        insuranceRate,
        durationMonths: termMonths,
        monthlyPayment: totalMonthlyPayment,
        status: 'APPROVED',
        approvalDate: new Date(),
        firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Create loan schedule
    const schedules: any[] = [];
    let remainingPrincipal = principal;
    const firstPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingPrincipal * monthlyRate;
      const principalPayment = monthlyPaymentWithoutInsurance - interestPayment;
      remainingPrincipal -= principalPayment;

      const dueDate = new Date(firstPaymentDate);
      dueDate.setMonth(dueDate.getMonth() + i - 1);

      schedules.push({
        id: uuidv4(),
        loanId,
        installmentNumber: i,
        dueDate,
        principalAmount: principalPayment,
        interestAmount: interestPayment,
        insuranceAmount: monthlyInsurance,
        totalAmount: totalMonthlyPayment,
        isPaid: false,
      });
    }

    await prisma.loanSchedule.createMany({
      data: schedules,
    });

    // Credit the account with loan amount
    await prisma.bankAccount.update({
      where: { id: accountId },
      data: { balance: { increment: principal } },
    });

    await prisma.accountOperations.create({
      data: {
        id: uuidv4(),
        accountId,
        type: 'DEPOSIT',
        amount: principal,
        description: `Loan disbursement - ${loanId}`,
        balanceAfter: account.balance.toNumber() + principal,
      },
    });

    res.status(201).json({
      message: 'Loan granted successfully',
      loanId: loan.id,
      monthlyPayment: totalMonthlyPayment,
      totalAmount: totalMonthlyPayment * termMonths,
      framework: 'Express',
    });
  }),
);

/**
 * GET /api/loans/:id
 * 
 * Get loan details
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        account: true,
        schedules: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!loan) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Loan not found',
      });
    }

    res.json({ loan, framework: 'Express' });
  }),
);

export default router;
