import {
  ISecurityRepository,
  SecurityEntity,
  CreateSecurityDto,
  UpdateSecurityDto,
  SecurityFilters,
} from '../../../domain/repositories/security.repository.interface';

/**
 * In-Memory implementation of Security Repository
 * 
 * Used for unit testing and development without database dependencies
 */
export class InMemorySecurityRepository implements ISecurityRepository {
  private securities: Map<string, SecurityEntity> = new Map();
  private symbolIndex: Map<string, string> = new Map(); // symbol -> securityId

  async findById(id: string): Promise<SecurityEntity | null> {
    return this.securities.get(id) || null;
  }

  async findBySymbol(symbol: string): Promise<SecurityEntity | null> {
    const securityId = this.symbolIndex.get(symbol);
    if (!securityId) return null;
    return this.securities.get(securityId) || null;
  }

  async create(security: CreateSecurityDto): Promise<SecurityEntity> {
    const newSecurity: SecurityEntity = {
      ...security,
    };

    this.securities.set(newSecurity.id, newSecurity);
    this.symbolIndex.set(newSecurity.symbol, newSecurity.id);

    return newSecurity;
  }

  async update(
    id: string,
    data: Partial<UpdateSecurityDto>,
  ): Promise<SecurityEntity> {
    const security = this.securities.get(id);
    if (!security) {
      throw new Error(`Security with id ${id} not found`);
    }

    // Update symbol index if symbol changes
    if (data.symbol && data.symbol !== security.symbol) {
      this.symbolIndex.delete(security.symbol);
      this.symbolIndex.set(data.symbol, id);
    }

    const updatedSecurity: SecurityEntity = {
      ...security,
      ...data,
      lastUpdated: data.lastUpdated || new Date(),
    };

    this.securities.set(id, updatedSecurity);
    return updatedSecurity;
  }

  async delete(id: string): Promise<void> {
    const security = this.securities.get(id);
    if (security) {
      this.symbolIndex.delete(security.symbol);
      this.securities.delete(id);
    }
  }

  async findAll(filters?: SecurityFilters): Promise<SecurityEntity[]> {
    let securities = Array.from(this.securities.values());

    if (filters?.type) {
      securities = securities.filter((s) => s.type === filters.type);
    }

    if (filters?.isAvailable !== undefined) {
      securities = securities.filter(
        (s) => s.isAvailable === filters.isAvailable,
      );
    }

    if (filters?.symbol) {
      securities = securities.filter((s) =>
        s.symbol.includes(filters.symbol!),
      );
    }

    return securities.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  async findAvailable(): Promise<SecurityEntity[]> {
    return this.findAll({ isAvailable: true });
  }

  // Test helper methods
  clear(): void {
    this.securities.clear();
    this.symbolIndex.clear();
  }

  getAll(): SecurityEntity[] {
    return Array.from(this.securities.values());
  }
}
