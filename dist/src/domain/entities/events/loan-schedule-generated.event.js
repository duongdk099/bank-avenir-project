"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanScheduleGeneratedEvent = void 0;
class LoanScheduleGeneratedEvent {
    aggregateId;
    schedule;
    occurredOn;
    eventType = 'LOAN_SCHEDULE_GENERATED';
    constructor(aggregateId, schedule, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.schedule = schedule;
        this.occurredOn = occurredOn;
    }
}
exports.LoanScheduleGeneratedEvent = LoanScheduleGeneratedEvent;
//# sourceMappingURL=loan-schedule-generated.event.js.map