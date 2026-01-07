/**
 * Email Verification Commands
 * CQRS Pattern - Commands for email verification operations
 */

export class GenerateEmailVerificationTokenCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class VerifyEmailCommand {
  constructor(
    public readonly userId: string,
    public readonly token: string,
  ) {}
}

export class ResendVerificationEmailCommand {
  constructor(
    public readonly userId: string,
  ) {}
}
