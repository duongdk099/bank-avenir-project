import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';

// Prisma implementations
import { PrismaUserRepository } from './prisma/user.repository';
import { PrismaBankAccountRepository } from './prisma/bank-account.repository';
import { PrismaSecurityRepository } from './prisma/security.repository';
import { PrismaLoanRepository } from './prisma/loan.repository';

// Repository tokens for dependency injection
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const BANK_ACCOUNT_REPOSITORY = 'BANK_ACCOUNT_REPOSITORY';
export const SECURITY_REPOSITORY = 'SECURITY_REPOSITORY';
export const LOAN_REPOSITORY = 'LOAN_REPOSITORY';

/**
 * Repository Module
 * 
 * Provides repository implementations via dependency injection.
 * By default, uses Prisma repositories for production.
 * Can be overridden in tests to use in-memory implementations.
 * 
 * Usage in tests:
 * ```typescript
 * TestingModule.createTestingModule({
 *   providers: [
 *     { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
 *     // ... other repositories
 *   ]
 * })
 * ```
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: BANK_ACCOUNT_REPOSITORY,
      useClass: PrismaBankAccountRepository,
    },
    {
      provide: SECURITY_REPOSITORY,
      useClass: PrismaSecurityRepository,
    },
    {
      provide: LOAN_REPOSITORY,
      useClass: PrismaLoanRepository,
    },
  ],
  exports: [
    USER_REPOSITORY,
    BANK_ACCOUNT_REPOSITORY,
    SECURITY_REPOSITORY,
    LOAN_REPOSITORY,
  ],
})
export class RepositoryModule {}
