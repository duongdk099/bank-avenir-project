import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { BankAccountAggregate } from '../../domain/entities/bank-account.aggregate.js';

/**
 * Daily Interest Calculation Service
 * 
 * Runs daily to calculate and apply interest to all active savings accounts.
 * Formula: interest = balance * (rate / 365)
 * 
 * As per Section 5.3 of Technical Documentation:
 * - Runs every day at midnight
 * - Only applies to SAVINGS accounts with ACTIVE status
 * - Generates INTEREST_APPLIED events
 * - Updates Read Model via event handlers (projectors)
 */
@Injectable()
export class InterestCalculationService {
  private readonly logger = new Logger(InterestCalculationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventStore: EventStore,
  ) {}

  /**
   * Scheduled job that runs daily at midnight
   * Cron expression: '0 0 * * *' = Every day at 00:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateDailyInterest(): Promise<void> {
    this.logger.log('Starting daily interest calculation job...');

    try {
      // Find all active savings accounts
      const savingsAccounts = await this.prisma.bankAccount.findMany({
        where: {
          accountType: 'SAVINGS',
          status: 'ACTIVE',
        },
      });

      this.logger.log(
        `Found ${savingsAccounts.length} active savings accounts`,
      );

      let successCount = 0;
      let errorCount = 0;

      // Process each account
      for (const account of savingsAccounts) {
        try {
          await this.applyInterestToAccount(account.id);
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to apply interest to account ${account.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Daily interest calculation completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Daily interest calculation job failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Apply interest to a specific account
   * This method can also be called manually if needed
   */
  async applyInterestToAccount(accountId: string): Promise<void> {
    // Load account aggregate from event store
    const events = await this.eventStore.getEventsForAggregate(
      accountId,
      'BankAccount',
    );

    const account = new BankAccountAggregate(accountId);
    account.loadFromHistory(events);

    // Validate account is eligible for interest
    if (account.getAccountType() !== 'SAVINGS') {
      throw new Error('Account is not a savings account');
    }

    if (account.getStatus() !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Apply interest (business logic in aggregate)
    account.applyInterest();

    // Save new events to event store
    // The event handlers (projectors) will automatically update the read model
    await this.eventStore.save(account, 'BankAccount');

    this.logger.debug(
      `Interest applied to account ${accountId}. New balance: ${account.getBalance().toString()}`,
    );
  }

  /**
   * Manual trigger for testing purposes
   * Can be exposed via admin endpoint if needed
   */
  async calculateInterestNow(): Promise<{ processed: number; errors: number }> {
    this.logger.log('Manual interest calculation triggered...');
    
    const savingsAccounts = await this.prisma.bankAccount.findMany({
      where: {
        accountType: 'SAVINGS',
        status: 'ACTIVE',
      },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const account of savingsAccounts) {
      try {
        await this.applyInterestToAccount(account.id);
        successCount++;
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Failed to apply interest to account ${account.id}: ${error.message}`,
        );
      }
    }

    return { processed: successCount, errors: errorCount };
  }
}
