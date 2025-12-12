import {
  IBankAccountRepository,
  BankAccountEntity,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  BankAccountFilters,
} from '../../../domain/repositories/bank-account.repository.interface';

/**
 * In-Memory implementation of Bank Account Repository
 * 
 * Used for unit testing and development without database dependencies
 */
export class InMemoryBankAccountRepository implements IBankAccountRepository {
  private accounts: Map<string, BankAccountEntity> = new Map();
  private ibanIndex: Map<string, string> = new Map(); // IBAN -> accountId

  async findById(id: string): Promise<BankAccountEntity | null> {
    return this.accounts.get(id) || null;
  }

  async findByIban(iban: string): Promise<BankAccountEntity | null> {
    const accountId = this.ibanIndex.get(iban);
    if (!accountId) return null;
    return this.accounts.get(accountId) || null;
  }

  async findByUserId(userId: string): Promise<BankAccountEntity[]> {
    const accounts = Array.from(this.accounts.values());
    return accounts
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async create(account: CreateBankAccountDto): Promise<BankAccountEntity> {
    const newAccount: BankAccountEntity = {
      ...account,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(newAccount.id, newAccount);
    this.ibanIndex.set(newAccount.iban, newAccount.id);

    return newAccount;
  }

  async update(
    id: string,
    data: Partial<UpdateBankAccountDto>,
  ): Promise<BankAccountEntity> {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error(`Account with id ${id} not found`);
    }

    const updatedAccount: BankAccountEntity = {
      ...account,
      ...data,
      updatedAt: new Date(),
    };

    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async delete(id: string): Promise<void> {
    const account = this.accounts.get(id);
    if (account) {
      this.ibanIndex.delete(account.iban);
      this.accounts.delete(id);
    }
  }

  async findAll(filters?: BankAccountFilters): Promise<BankAccountEntity[]> {
    let accounts = Array.from(this.accounts.values());

    if (filters?.userId) {
      accounts = accounts.filter((a) => a.userId === filters.userId);
    }

    if (filters?.accountType) {
      accounts = accounts.filter((a) => a.accountType === filters.accountType);
    }

    if (filters?.status) {
      accounts = accounts.filter((a) => a.status === filters.status);
    }

    return accounts.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async existsByIban(iban: string): Promise<boolean> {
    return this.ibanIndex.has(iban);
  }

  // Test helper methods
  clear(): void {
    this.accounts.clear();
    this.ibanIndex.clear();
  }

  getAll(): BankAccountEntity[] {
    return Array.from(this.accounts.values());
  }
}
