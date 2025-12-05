import { AggregateRoot } from './aggregate-root.js';
import { IDomainEvent } from './domain-event.interface.js';
import { AccountOpenedEvent } from './events/account-opened.event.js';
import { FundsDepositedEvent } from './events/funds-deposited.event.js';
import { FundsWithdrawnEvent } from './events/funds-withdrawn.event.js';
import { TransferSentEvent } from './events/transfer-sent.event.js';
import { TransferReceivedEvent } from './events/transfer-received.event.js';
import { InterestAppliedEvent } from './events/interest-applied.event.js';
import { Money } from '../value-objects/money.vo.js';
import { IBAN } from '../value-objects/iban.vo.js';

export class BankAccountAggregate extends AggregateRoot {
  private userId: string;
  private iban: IBAN;
  private accountType: string;
  private balance: Money;
  private status: string;
  private interestRate?: number;

  constructor(id: string) {
    super(id);
  }

  /**
   * Factory method to open a new bank account
   */
  static open(
    id: string,
    userId: string,
    iban: string,
    accountType: string,
    initialBalance: number = 0,
    interestRate?: number,
  ): BankAccountAggregate {
    const account = new BankAccountAggregate(id);
    const event = new AccountOpenedEvent(
      id,
      userId,
      iban,
      accountType,
      initialBalance,
      'EUR',
    );
    account.apply(event);
    return account;
  }

  /**
   * Deposit funds into the account
   */
  deposit(amount: number, description: string = 'Deposit'): void {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot deposit to an inactive account');
    }

    const depositAmount = Money.create(amount);
    const newBalance = this.balance.add(depositAmount);

    const event = new FundsDepositedEvent(
      this.id,
      amount,
      'EUR',
      newBalance.getAmount(),
      description,
    );
    this.apply(event);
  }

  /**
   * Withdraw funds from the account
   */
  withdraw(amount: number, description: string = 'Withdrawal'): void {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot withdraw from an inactive account');
    }

    const withdrawAmount = Money.create(amount);
    
    if (this.balance.isLessThan(withdrawAmount)) {
      throw new Error('Insufficient funds');
    }

    const newBalance = this.balance.subtract(withdrawAmount);

    const event = new FundsWithdrawnEvent(
      this.id,
      amount,
      'EUR',
      newBalance.getAmount(),
      description,
    );
    this.apply(event);
  }

  /**
   * Send a transfer to another account (internal transfers only)
   */
  sendTransfer(
    recipientAccountId: string,
    recipientIban: string,
    amount: number,
    description: string = 'Transfer',
  ): void {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot transfer from an inactive account');
    }

    // Validate recipient IBAN is from AVENIR bank (internal transfers only)
    if (!this.isInternalIban(recipientIban)) {
      throw new Error(
        'External transfers not allowed. Only internal transfers within AVENIR bank are permitted.',
      );
    }

    const transferAmount = Money.create(amount);
    
    if (this.balance.isLessThan(transferAmount)) {
      throw new Error('Insufficient funds for transfer');
    }

    const newBalance = this.balance.subtract(transferAmount);

    const event = new TransferSentEvent(
      this.id,
      recipientAccountId,
      recipientIban,
      amount,
      'EUR',
      newBalance.getAmount(),
      description,
    );
    this.apply(event);
  }

  /**
   * Receive a transfer from another account
   */
  receiveTransfer(
    senderAccountId: string,
    senderIban: string,
    amount: number,
    description: string = 'Transfer received',
  ): void {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot receive transfer to an inactive account');
    }

    const transferAmount = Money.create(amount);
    const newBalance = this.balance.add(transferAmount);

    const event = new TransferReceivedEvent(
      this.id,
      senderAccountId,
      senderIban,
      amount,
      'EUR',
      newBalance.getAmount(),
      description,
    );
    this.apply(event);
  }

  /**
   * Apply daily interest (for savings accounts)
   */
  applyInterest(): void {
    if (this.accountType !== 'SAVINGS') {
      throw new Error('Interest can only be applied to savings accounts');
    }

    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot apply interest to an inactive account');
    }

    if (!this.interestRate || this.interestRate <= 0) {
      throw new Error('Invalid interest rate');
    }

    // Calculate daily interest: balance * (rate / 365)
    const dailyRate = this.interestRate / 365;
    const interestAmount = this.balance.multiply(dailyRate);

    // Only apply if interest is non-zero
    if (!interestAmount.isZero()) {
      const newBalance = this.balance.add(interestAmount);

      const event = new InterestAppliedEvent(
        this.id,
        interestAmount.getAmount(),
        'EUR',
        this.interestRate,
        newBalance.getAmount(),
      );
      this.apply(event);
    }
  }

  /**
   * Check if IBAN belongs to AVENIR bank (internal)
   * AVENIR IBANs start with FR and contain bank code 12345
   */
  private isInternalIban(iban: string): boolean {
    const cleanIban = iban.replace(/\s/g, '');
    // FR (2) + Check digits (2) + Bank code (5) = first 9 characters
    // Bank code starts at position 4
    const bankCode = cleanIban.substring(4, 9);
    return cleanIban.startsWith('FR') && bankCode === '12345';
  }

  // Event handlers
  protected applyEvent(event: IDomainEvent): void {
    switch (event.eventType) {
      case 'ACCOUNT_OPENED':
        this.onAccountOpened(event as AccountOpenedEvent);
        break;
      case 'FUNDS_DEPOSITED':
        this.onFundsDeposited(event as FundsDepositedEvent);
        break;
      case 'FUNDS_WITHDRAWN':
        this.onFundsWithdrawn(event as FundsWithdrawnEvent);
        break;
      case 'TRANSFER_SENT':
        this.onTransferSent(event as TransferSentEvent);
        break;
      case 'TRANSFER_RECEIVED':
        this.onTransferReceived(event as TransferReceivedEvent);
        break;
      case 'INTEREST_APPLIED':
        this.onInterestApplied(event as InterestAppliedEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
  }

  private onAccountOpened(event: AccountOpenedEvent): void {
    this.userId = event.userId;
    this.iban = IBAN.create(event.iban);
    this.accountType = event.accountType;
    this.balance = Money.create(event.initialBalance, event.currency);
    this.status = 'ACTIVE';
    
    // Set interest rate for savings accounts (default 2%)
    if (this.accountType === 'SAVINGS') {
      this.interestRate = 0.02; // 2% annual rate
    }
  }

  private onFundsDeposited(event: FundsDepositedEvent): void {
    this.balance = Money.create(event.balanceAfter, event.currency);
  }

  private onFundsWithdrawn(event: FundsWithdrawnEvent): void {
    this.balance = Money.create(event.balanceAfter, event.currency);
  }

  private onTransferSent(event: TransferSentEvent): void {
    this.balance = Money.create(event.balanceAfter, event.currency);
  }

  private onTransferReceived(event: TransferReceivedEvent): void {
    this.balance = Money.create(event.balanceAfter, event.currency);
  }

  private onInterestApplied(event: InterestAppliedEvent): void {
    this.balance = Money.create(event.balanceAfter, event.currency);
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getIban(): IBAN {
    return this.iban;
  }

  getAccountType(): string {
    return this.accountType;
  }

  getBalance(): Money {
    return this.balance;
  }

  getStatus(): string {
    return this.status;
  }

  getInterestRate(): number | undefined {
    return this.interestRate;
  }
}
