import { LoanEntity, LoanStatus } from '../types/entity.types';

// Re-export for convenience
export type { LoanEntity };
export { LoanStatus };

/**
 * Loan Repository Interface
 * 
 * Domain layer interface for loan persistence operations
 */
export interface ILoanRepository {
  /**
   * Find loan by ID
   */
  findById(id: string): Promise<LoanEntity | null>;

  /**
   * Find all loans for a user
   */
  findByUserId(userId: string): Promise<LoanEntity[]>;

  /**
   * Find all loans for an account
   */
  findByAccountId(accountId: string): Promise<LoanEntity[]>;

  /**
   * Create a new loan
   */
  create(loan: CreateLoanDto): Promise<LoanEntity>;

  /**
   * Update loan
   */
  update(id: string, data: Partial<UpdateLoanDto>): Promise<LoanEntity>;

  /**
   * Delete loan
   */
  delete(id: string): Promise<void>;

  /**
   * Find all loans with optional filters
   */
  findAll(filters?: LoanFilters): Promise<LoanEntity[]>;
}

// LoanEntity imported from entity.types

export interface CreateLoanDto {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  interestRate: number;
  insuranceRate: number;
  durationMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  approvalDate?: Date;
  firstPaymentDate?: Date;
}

export interface UpdateLoanDto {
  status?: LoanStatus;
  approvalDate?: Date;
  firstPaymentDate?: Date;
}

export interface LoanFilters {
  userId?: string;
  accountId?: string;
  status?: LoanStatus;
}
