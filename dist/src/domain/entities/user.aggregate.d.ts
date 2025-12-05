import { AggregateRoot } from './aggregate-root.js';
import { IDomainEvent } from './domain-event.interface.js';
export declare class UserAggregate extends AggregateRoot {
    private email;
    private passwordHash;
    private role;
    private status;
    private emailConfirmed;
    constructor(id: string);
    static register(id: string, email: string, passwordHash: string, role?: string): UserAggregate;
    confirmEmail(): void;
    protected applyEvent(event: IDomainEvent): void;
    private onUserRegistered;
    private onUserEmailConfirmed;
    getEmail(): string;
    getPasswordHash(): string;
    getRole(): string;
    getStatus(): string;
    isEmailConfirmed(): boolean;
}
