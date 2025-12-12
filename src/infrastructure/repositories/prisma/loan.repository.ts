import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Loan } from '@prisma/client';
import {
  ILoanRepository,
  LoanEntity,
  CreateLoanDto,
  UpdateLoanDto,
  LoanFilters,
} from '../../../domain/repositories/loan.repository.interface';
import { LoanStatus } from '../../../domain/types/entity.types';

/**
 * Prisma-based implementation of Loan Repository
 */
@Injectable()
export class PrismaLoanRepository implements ILoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convert Prisma Loan to LoanEntity domain model
   */
  private toDomain(loan: Loan): LoanEntity {
    return {
      id: loan.id,
      userId: loan.userId,
      accountId: loan.accountId,
      amount: loan.amount.toNumber(),
      interestRate: loan.interestRate.toNumber(),
      insuranceRate: loan.insuranceRate.toNumber(),
      durationMonths: loan.durationMonths,
      monthlyPayment: loan.monthlyPayment.toNumber(),
      status: loan.status as LoanStatus,
      createdAt: loan.createdAt,
      approvalDate: loan.approvalDate ?? undefined,
      firstPaymentDate: loan.firstPaymentDate ?? undefined,
    };
  }

  async findById(id: string): Promise<LoanEntity | null> {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
    });
    return loan ? this.toDomain(loan) : null;
  }

  async findByUserId(userId: string): Promise<LoanEntity[]> {
    const loans = await this.prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return loans.map((loan) => this.toDomain(loan));
  }

  async findByAccountId(accountId: string): Promise<LoanEntity[]> {
    const loans = await this.prisma.loan.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
    return loans.map((loan) => this.toDomain(loan));
  }

  async create(loan: CreateLoanDto): Promise<LoanEntity> {
    const created = await this.prisma.loan.create({
      data: loan,
    });
    return this.toDomain(created);
  }

  async update(
    id: string,
    data: Partial<UpdateLoanDto>,
  ): Promise<LoanEntity> {
    const updated = await this.prisma.loan.update({
      where: { id },
      data,
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loan.delete({
      where: { id },
    });
  }

  async findAll(filters?: LoanFilters): Promise<LoanEntity[]> {
    const loans = await this.prisma.loan.findMany({
      where: {
        userId: filters?.userId,
        accountId: filters?.accountId,
        status: filters?.status,
      },
      orderBy: { createdAt: 'desc' },
    });
    return loans.map((loan) => this.toDomain(loan));
  }
}
