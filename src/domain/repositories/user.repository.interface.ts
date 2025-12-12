import { UserEntity, UserRole, UserStatus, UserProfileEntity } from '../types/entity.types';

// Re-export for convenience
export type { UserEntity, UserProfileEntity };
export { UserRole, UserStatus };

/**
 * User Repository Interface
 * 
 * Following Clean Architecture principles, this interface is defined in the Domain layer
 * and implemented in the Infrastructure layer.
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Create a new user
   */
  create(user: CreateUserDto): Promise<UserEntity>;

  /**
   * Update user
   */
  update(id: string, data: Partial<UpdateUserDto>): Promise<UserEntity>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Find all users with optional filters
   */
  findAll(filters?: UserFilters): Promise<UserEntity[]>;

  /**
   * Count users
   */
  count(filters?: UserFilters): Promise<number>;
}

// UserEntity and UserProfileEntity imported from entity.types

export interface CreateUserDto {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    dateOfBirth?: Date;
  };
}

export interface UpdateUserDto {
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  status?: UserStatus;
  profile?: Partial<{
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    dateOfBirth?: Date;
  }>;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  email?: string;
}
