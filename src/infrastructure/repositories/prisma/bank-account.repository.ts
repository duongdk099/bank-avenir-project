import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  IBankAccountRepository,
  BankAccountEntity,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  BankAccountFilters,
} from '../../../domain/repositories/bank-account.repository.interface';

/**
 * Prisma-based implementation of Bank Account Repository
 */
@Injectable()
export class PrismaBankAccountRepository implements IBankAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(prismaAccount: any): BankAccountEntity {
    return {
      ...prismaAccount,
      balance: prismaAccount.balance.toNumber(),
      name: prismaAccount.name ?? undefined,
    };
  }

  async findById(id: string): Promise<BankAccountEntity | null> {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });
    return account ? this.toDomain(account) : null;
  }

  async findByIban(iban: string): Promise<BankAccountEntity | null> {
    const account = await this.prisma.bankAccount.findUnique({
      where: { iban },
    });
    return account ? this.toDomain(account) : null;
  }

  async findByUserId(userId: string): Promise<BankAccountEntity[]> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map(acc => this.toDomain(acc));
  }

  async create(account: CreateBankAccountDto): Promise<BankAccountEntity> {
    const created = await this.prisma.bankAccount.create({
      data: account,
    });
    return this.toDomain(created);
  }

  async update(
    id: string,
    data: Partial<UpdateBankAccountDto>,
  ): Promise<BankAccountEntity> {
    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data,
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.bankAccount.delete({
      where: { id },
    });
  }

  async findAll(filters?: BankAccountFilters): Promise<BankAccountEntity[]> {
    const accounts = await this.prisma.bankAccount.findMany({
      where: {
        userId: filters?.userId,
        accountType: filters?.accountType,
        status: filters?.status,
      },
      orderBy: { createdAt: 'desc' },
    });
    return accounts.map(acc => this.toDomain(acc));
  }

  async existsByIban(iban: string): Promise<boolean> {
    const account = await this.prisma.bankAccount.findUnique({
      where: { iban },
      select: { id: true },
    });
    return account !== null;
  }
}
