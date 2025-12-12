/**
 * Domain Entity Types
 * These represent the data structures used in repositories
 */

export enum UserRole {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
}

export interface UserProfileEntity {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  dateOfBirth?: Date;
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfileEntity;
}

export interface BankAccountEntity {
  id: string;
  userId: string;
  iban: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityEntity {
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

export interface LoanEntity {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  interestRate: number;
  insuranceRate: number;
  durationMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  createdAt: Date;
  approvalDate?: Date;
  firstPaymentDate?: Date;
}
