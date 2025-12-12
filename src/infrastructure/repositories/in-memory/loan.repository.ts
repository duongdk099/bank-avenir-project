import {
  ILoanRepository,
  LoanEntity,
  CreateLoanDto,
  UpdateLoanDto,
  LoanFilters,
} from '../../../domain/repositories/loan.repository.interface';

/**
 * In-Memory implementation of Loan Repository
 * 
 * Used for unit testing and development without database dependencies
 */
export class InMemoryLoanRepository implements ILoanRepository {
  private loans: Map<string, LoanEntity> = new Map();

  async findById(id: string): Promise<LoanEntity | null> {
    return this.loans.get(id) || null;
  }

  async findByUserId(userId: string): Promise<LoanEntity[]> {
    const loans = Array.from(this.loans.values());
    return loans
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByAccountId(accountId: string): Promise<LoanEntity[]> {
    const loans = Array.from(this.loans.values());
    return loans
      .filter((l) => l.accountId === accountId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async create(loan: CreateLoanDto): Promise<LoanEntity> {
    const newLoan: LoanEntity = {
      ...loan,
      createdAt: new Date(),
    };

    this.loans.set(newLoan.id, newLoan);
    return newLoan;
  }

  async update(id: string, data: Partial<UpdateLoanDto>): Promise<LoanEntity> {
    const loan = this.loans.get(id);
    if (!loan) {
      throw new Error(`Loan with id ${id} not found`);
    }

    const updatedLoan: LoanEntity = {
      ...loan,
      ...data,
    };

    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }

  async delete(id: string): Promise<void> {
    this.loans.delete(id);
  }

  async findAll(filters?: LoanFilters): Promise<LoanEntity[]> {
    let loans = Array.from(this.loans.values());

    if (filters?.userId) {
      loans = loans.filter((l) => l.userId === filters.userId);
    }

    if (filters?.accountId) {
      loans = loans.filter((l) => l.accountId === filters.accountId);
    }

    if (filters?.status) {
      loans = loans.filter((l) => l.status === filters.status);
    }

    return loans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Test helper methods
  clear(): void {
    this.loans.clear();
  }

  getAll(): LoanEntity[] {
    return Array.from(this.loans.values());
  }
}
