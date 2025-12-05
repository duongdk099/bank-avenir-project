import { AggregateRoot } from './aggregate-root.js';
import { IDomainEvent } from './domain-event.interface.js';
import { UserRegisteredEvent } from './events/user-registered.event.js';
import { UserEmailConfirmedEvent } from './events/user-email-confirmed.event.js';

export class UserAggregate extends AggregateRoot {
  private email: string;
  private passwordHash: string;
  private role: string;
  private status: string;
  private emailConfirmed: boolean = false;

  constructor(id: string) {
    super(id);
  }

  // Factory method to create a new user
  static register(
    id: string,
    email: string,
    passwordHash: string,
    role: string = 'CLIENT',
  ): UserAggregate {
    const user = new UserAggregate(id);
    const event = new UserRegisteredEvent(id, email, passwordHash, role);
    user.apply(event);
    return user;
  }

  // Business method to confirm email
  confirmEmail(): void {
    if (this.emailConfirmed) {
      throw new Error('Email is already confirmed');
    }
    const event = new UserEmailConfirmedEvent(this.id, this.email);
    this.apply(event);
  }

  // Event handlers
  protected applyEvent(event: IDomainEvent): void {
    if (event.eventType === 'USER_REGISTERED') {
      this.onUserRegistered(event as UserRegisteredEvent);
    } else if (event.eventType === 'USER_EMAIL_CONFIRMED') {
      this.onUserEmailConfirmed(event as UserEmailConfirmedEvent);
    }
  }

  private onUserRegistered(event: UserRegisteredEvent): void {
    this.email = event.email;
    this.passwordHash = event.passwordHash;
    this.role = event.role;
    this.status = 'ACTIVE';
    this.emailConfirmed = false;
  }

  private onUserEmailConfirmed(event: UserEmailConfirmedEvent): void {
    this.emailConfirmed = true;
  }

  // Getters
  getEmail(): string {
    return this.email;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getRole(): string {
    return this.role;
  }

  getStatus(): string {
    return this.status;
  }

  isEmailConfirmed(): boolean {
    return this.emailConfirmed;
  }
}
