import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Security } from '@prisma/client';
import {
  ISecurityRepository,
  SecurityEntity,
  CreateSecurityDto,
  UpdateSecurityDto,
  SecurityFilters,
} from '../../../domain/repositories/security.repository.interface';

/**
 * Prisma-based implementation of Security Repository
 */
@Injectable()
export class PrismaSecurityRepository implements ISecurityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convert Prisma Security to SecurityEntity domain model
   */
  private toDomain(security: Security): SecurityEntity {
    return {
      id: security.id,
      symbol: security.symbol,
      name: security.name,
      type: security.type,
      exchange: security.exchange ?? undefined,
      currentPrice: security.currentPrice.toNumber(),
      currency: security.currency,
      isAvailable: security.isAvailable,
      lastUpdated: security.lastUpdated,
    };
  }

  async findById(id: string): Promise<SecurityEntity | null> {
    const security = await this.prisma.security.findUnique({
      where: { id },
    });
    return security ? this.toDomain(security) : null;
  }

  async findBySymbol(symbol: string): Promise<SecurityEntity | null> {
    const security = await this.prisma.security.findUnique({
      where: { symbol },
    });
    return security ? this.toDomain(security) : null;
  }

  async create(security: CreateSecurityDto): Promise<SecurityEntity> {
    const created = await this.prisma.security.create({
      data: security,
    });
    return this.toDomain(created);
  }

  async update(
    id: string,
    data: Partial<UpdateSecurityDto>,
  ): Promise<SecurityEntity> {
    const updated = await this.prisma.security.update({
      where: { id },
      data,
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.security.delete({
      where: { id },
    });
  }

  async findAll(filters?: SecurityFilters): Promise<SecurityEntity[]> {
    const securities = await this.prisma.security.findMany({
      where: {
        type: filters?.type,
        isAvailable: filters?.isAvailable,
        symbol: filters?.symbol ? { contains: filters.symbol } : undefined,
      },
      orderBy: { symbol: 'asc' },
    });
    return securities.map((security) => this.toDomain(security));
  }

  async findAvailable(): Promise<SecurityEntity[]> {
    const securities = await this.prisma.security.findMany({
      where: { isAvailable: true },
      orderBy: { symbol: 'asc' },
    });
    return securities.map((security) => this.toDomain(security));
  }
}
