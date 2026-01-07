/**
 * Domain Events for Email Verification
 * Following Event Sourcing pattern
 */

export class EmailVerificationTokenGeneratedEvent {
  constructor(
    public readonly userId: string,
    public readonly token: string,
    public readonly email: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class EmailVerifiedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verifiedAt: Date = new Date(),
  ) {}
}

export class EmailVerificationTokenExpiredEvent {
  constructor(
    public readonly userId: string,
    public readonly token: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
