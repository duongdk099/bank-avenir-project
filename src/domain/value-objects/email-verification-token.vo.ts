import { randomBytes } from 'crypto';

/**
 * Value Object: EmailVerificationToken
 * Represents a secure token for email verification
 */
export class EmailVerificationToken {
  private readonly value: string;

  private constructor(token: string) {
    this.value = token;
  }

  /**
   * Generate a new verification token
   */
  static generate(): EmailVerificationToken {
    const token = randomBytes(32).toString('hex');
    return new EmailVerificationToken(token);
  }

  /**
   * Create from existing token
   */
  static fromString(token: string): EmailVerificationToken {
    if (!token || token.length < 32) {
      throw new Error('Invalid verification token');
    }
    return new EmailVerificationToken(token);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: EmailVerificationToken): boolean {
    return this.value === other.value;
  }
}
