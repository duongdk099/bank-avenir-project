import { SecurityEntity } from '../types/entity.types';
// Re-export for convenience
export type { SecurityEntity };
/**
 * Security (Stock) Repository Interface
 * 
 * Domain layer interface for security/stock persistence operations
 */
export interface ISecurityRepository {
  /**
   * Find security by ID
   */
  findById(id: string): Promise<SecurityEntity | null>;

  /**
   * Find security by symbol
   */
  findBySymbol(symbol: string): Promise<SecurityEntity | null>;

  /**
   * Create a new security
   */
  create(security: CreateSecurityDto): Promise<SecurityEntity>;

  /**
   * Update security
   */
  update(id: string, data: Partial<UpdateSecurityDto>): Promise<SecurityEntity>;

  /**
   * Delete security
   */
  delete(id: string): Promise<void>;

  /**
   * Find all securities with optional filters
   */
  findAll(filters?: SecurityFilters): Promise<SecurityEntity[]>;

  /**
   * Find available securities for trading
   */
  findAvailable(): Promise<SecurityEntity[]>;
}

// SecurityEntity imported from entity.types

export interface CreateSecurityDto {
  id: string;
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
  currentPrice: number;
  currency: string;
  isAvailable: boolean;
  lastUpdated: Date;
}

export interface UpdateSecurityDto {
  symbol?: string;
  name?: string;
  type?: string;
  exchange?: string;
  currentPrice?: number;
  currency?: string;
  isAvailable?: boolean;
  lastUpdated?: Date;
}

export interface SecurityFilters {
  type?: string;
  isAvailable?: boolean;
  symbol?: string;
}
