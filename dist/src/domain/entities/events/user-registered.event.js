"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRegisteredEvent = void 0;
class UserRegisteredEvent {
    aggregateId;
    email;
    passwordHash;
    role;
    occurredOn;
    eventType = 'USER_REGISTERED';
    constructor(aggregateId, email, passwordHash, role, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.occurredOn = occurredOn;
    }
}
exports.UserRegisteredEvent = UserRegisteredEvent;
//# sourceMappingURL=user-registered.event.js.map