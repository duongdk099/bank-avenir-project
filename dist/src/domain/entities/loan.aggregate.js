"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanAggregate = void 0;
const aggregate_root_js_1 = require("./aggregate-root.js");
const loan_granted_event_js_1 = require("./events/loan-granted.event.js");
const loan_schedule_generated_event_js_1 = require("./events/loan-schedule-generated.event.js");
class LoanAggregate extends aggregate_root_js_1.AggregateRoot {
    userId;
    accountId;
    principal;
    annualRate;
    termMonths;
    insuranceRate;
    monthlyPayment;
    totalAmount;
    status;
    schedule;
    constructor(id) {
        super(id);
    }
    static grant(id, userId, accountId, principal, annualRate, termMonths, insuranceRate) {
        if (principal <= 0) {
            throw new Error('Principal must be positive');
        }
        if (annualRate < 0) {
            throw new Error('Annual rate cannot be negative');
        }
        if (termMonths <= 0) {
            throw new Error('Term must be positive');
        }
        if (insuranceRate < 0) {
            throw new Error('Insurance rate cannot be negative');
        }
        const loan = new LoanAggregate(id);
        const monthlyRate = annualRate / 12;
        let monthlyPaymentWithoutInsurance;
        if (monthlyRate === 0) {
            monthlyPaymentWithoutInsurance = principal / termMonths;
        }
        else {
            monthlyPaymentWithoutInsurance =
                (principal * monthlyRate) /
                    (1 - Math.pow(1 + monthlyRate, -termMonths));
        }
        const monthlyInsurance = (principal * insuranceRate) / termMonths;
        const totalMonthlyPayment = monthlyPaymentWithoutInsurance + monthlyInsurance;
        const totalAmount = totalMonthlyPayment * termMonths;
        const event = new loan_granted_event_js_1.LoanGrantedEvent(id, userId, accountId, principal, annualRate, termMonths, insuranceRate, totalMonthlyPayment, totalAmount, 'APPROVED');
        loan.apply(event);
        return loan;
    }
    generateSchedule() {
        if (!this.principal || !this.termMonths) {
            throw new Error('Loan not properly initialized');
        }
        const schedule = [];
        let remainingBalance = this.principal;
        const monthlyRate = this.annualRate / 12;
        const monthlyInsurance = (this.principal * this.insuranceRate) / this.termMonths;
        for (let month = 1; month <= this.termMonths; month++) {
            const interest = remainingBalance * monthlyRate;
            let principalPayment = this.monthlyPayment - interest - monthlyInsurance;
            if (month === this.termMonths) {
                principalPayment = remainingBalance;
            }
            if (principalPayment > remainingBalance) {
                principalPayment = remainingBalance;
            }
            const totalPayment = principalPayment + interest + monthlyInsurance;
            remainingBalance -= principalPayment;
            if (remainingBalance < 0.01) {
                remainingBalance = 0;
            }
            schedule.push({
                month,
                principal: Math.round(principalPayment * 100) / 100,
                interest: Math.round(interest * 100) / 100,
                insurance: Math.round(monthlyInsurance * 100) / 100,
                totalPayment: Math.round(totalPayment * 100) / 100,
                remainingBalance: Math.round(remainingBalance * 100) / 100,
            });
        }
        const event = new loan_schedule_generated_event_js_1.LoanScheduleGeneratedEvent(this.id, schedule);
        this.apply(event);
    }
    applyEvent(event) {
        switch (event.eventType) {
            case 'LOAN_GRANTED':
                this.onLoanGranted(event);
                break;
            case 'LOAN_SCHEDULE_GENERATED':
                this.onLoanScheduleGenerated(event);
                break;
            default:
                throw new Error(`Unknown event type: ${event.eventType}`);
        }
    }
    onLoanGranted(event) {
        this.userId = event.userId;
        this.accountId = event.accountId;
        this.principal = event.principal;
        this.annualRate = event.annualRate;
        this.termMonths = event.termMonths;
        this.insuranceRate = event.insuranceRate;
        this.monthlyPayment = event.monthlyPayment;
        this.totalAmount = event.totalAmount;
        this.status = event.status;
    }
    onLoanScheduleGenerated(event) {
        this.schedule = event.schedule;
    }
    getUserId() {
        return this.userId;
    }
    getAccountId() {
        return this.accountId;
    }
    getPrincipal() {
        return this.principal;
    }
    getAnnualRate() {
        return this.annualRate;
    }
    getTermMonths() {
        return this.termMonths;
    }
    getInsuranceRate() {
        return this.insuranceRate;
    }
    getMonthlyPayment() {
        return this.monthlyPayment;
    }
    getTotalAmount() {
        return this.totalAmount;
    }
    getStatus() {
        return this.status;
    }
    getSchedule() {
        return this.schedule;
    }
}
exports.LoanAggregate = LoanAggregate;
//# sourceMappingURL=loan.aggregate.js.map