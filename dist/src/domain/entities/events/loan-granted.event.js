"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanGrantedEvent = void 0;
class LoanGrantedEvent {
    aggregateId;
    userId;
    accountId;
    principal;
    annualRate;
    termMonths;
    insuranceRate;
    monthlyPayment;
    totalAmount;
    status;
    occurredOn;
    eventType = 'LOAN_GRANTED';
    constructor(aggregateId, userId, accountId, principal, annualRate, termMonths, insuranceRate, monthlyPayment, totalAmount, status, occurredOn = new Date()) {
        this.aggregateId = aggregateId;
        this.userId = userId;
        this.accountId = accountId;
        this.principal = principal;
        this.annualRate = annualRate;
        this.termMonths = termMonths;
        this.insuranceRate = insuranceRate;
        this.monthlyPayment = monthlyPayment;
        this.totalAmount = totalAmount;
        this.status = status;
        this.occurredOn = occurredOn;
    }
}
exports.LoanGrantedEvent = LoanGrantedEvent;
//# sourceMappingURL=loan-granted.event.js.map