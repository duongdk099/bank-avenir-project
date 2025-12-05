"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAggregate = void 0;
const aggregate_root_js_1 = require("./aggregate-root.js");
const user_registered_event_js_1 = require("./events/user-registered.event.js");
const user_email_confirmed_event_js_1 = require("./events/user-email-confirmed.event.js");
class UserAggregate extends aggregate_root_js_1.AggregateRoot {
    email;
    passwordHash;
    role;
    status;
    emailConfirmed = false;
    constructor(id) {
        super(id);
    }
    static register(id, email, passwordHash, role = 'CLIENT') {
        const user = new UserAggregate(id);
        const event = new user_registered_event_js_1.UserRegisteredEvent(id, email, passwordHash, role);
        user.apply(event);
        return user;
    }
    confirmEmail() {
        if (this.emailConfirmed) {
            throw new Error('Email is already confirmed');
        }
        const event = new user_email_confirmed_event_js_1.UserEmailConfirmedEvent(this.id, this.email);
        this.apply(event);
    }
    applyEvent(event) {
        if (event.eventType === 'USER_REGISTERED') {
            this.onUserRegistered(event);
        }
        else if (event.eventType === 'USER_EMAIL_CONFIRMED') {
            this.onUserEmailConfirmed(event);
        }
    }
    onUserRegistered(event) {
        this.email = event.email;
        this.passwordHash = event.passwordHash;
        this.role = event.role;
        this.status = 'ACTIVE';
        this.emailConfirmed = false;
    }
    onUserEmailConfirmed(event) {
        this.emailConfirmed = true;
    }
    getEmail() {
        return this.email;
    }
    getPasswordHash() {
        return this.passwordHash;
    }
    getRole() {
        return this.role;
    }
    getStatus() {
        return this.status;
    }
    isEmailConfirmed() {
        return this.emailConfirmed;
    }
}
exports.UserAggregate = UserAggregate;
//# sourceMappingURL=user.aggregate.js.map