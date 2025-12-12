import { BankAccountEntity, AccountType } from '../types/entity.types';

// Re-export for convenience
export type { BankAccountEntity, AccountType };

/**
 * Bank Account Repository Interface
 * 
 * Domain layer interface for account persistence operations
 */
export interface IBankAccountRepository {
  /**
   * Find account by ID
   */
  findById(id: string): Promise<BankAccountEntity | null>;

  /**
   * Find account by IBAN
   */
  findByIban(iban: string): Promise<BankAccountEntity | null>;

  /**
   * Find all accounts for a user
   */
  findByUserId(userId: string): Promise<BankAccountEntity[]>;

  /**
   * Create a new account
   */
  create(account: CreateBankAccountDto): Promise<BankAccountEntity>;

  /**
   * Update account
   */
  update(id: string, data: Partial<UpdateBankAccountDto>): Promise<BankAccountEntity>;

  /**
   * Delete account
   */
  delete(id: string): Promise<void>;

  /**
   * Find all accounts with optional filters
   */
  findAll(filters?: BankAccountFilters): Promise<BankAccountEntity[]>;

  /**
   * Check if IBAN exists
   */
  existsByIban(iban: string): Promise<boolean>;
}

export interface CreateBankAccountDto {
  id: string;
  userId: string;
  iban: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: string;
  name?: string;
}

export interface UpdateBankAccountDto {
  balance?: number;
  status?: string;
  name?: string;
}

export interface BankAccountFilters {
  userId?: string;
  accountType?: AccountType;
  status?: string;
}
