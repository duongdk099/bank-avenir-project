"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEmailConfirmedEvent = void 0;
class UserEmailConfirmedEvent {
    aggregateId;
    email;
    occurredOn;
    eventType = 'USER_EMAIL_CONFIRMED';
    constructor(aggregateId, email, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.email = email;
        this.occurredOn = occurredOn;
    }
}
exports.UserEmailConfirmedEvent = UserEmailConfirmedEvent;
//# sourceMappingURL=user-email-confirmed.event.js.map