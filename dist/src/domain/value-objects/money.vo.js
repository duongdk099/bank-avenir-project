"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Money = void 0;
class Money {
    amount;
    currency;
    constructor(amount, currency = 'EUR') {
        this.amount = amount;
        this.currency = currency;
    }
    static create(amount, currency = 'EUR') {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
        if (!currency || currency.length !== 3) {
            throw new Error('Currency must be a 3-letter code');
        }
        const roundedAmount = Math.round(amount * 100) / 100;
        return new Money(roundedAmount, currency.toUpperCase());
    }
    static zero(currency = 'EUR') {
        return new Money(0, currency);
    }
    getAmount() {
        return this.amount;
    }
    getCurrency() {
        return this.currency;
    }
    add(other) {
        this.ensureSameCurrency(other);
        return new Money(this.amount + other.amount, this.currency);
    }
    subtract(other) {
        this.ensureSameCurrency(other);
        const result = this.amount - other.amount;
        if (result < 0) {
            throw new Error('Insufficient funds');
        }
        return new Money(result, this.currency);
    }
    multiply(multiplier) {
        if (multiplier < 0) {
            throw new Error('Multiplier cannot be negative');
        }
        return new Money(this.amount * multiplier, this.currency);
    }
    divide(divisor) {
        if (divisor <= 0) {
            throw new Error('Divisor must be positive');
        }
        return new Money(this.amount / divisor, this.currency);
    }
    isGreaterThan(other) {
        this.ensureSameCurrency(other);
        return this.amount > other.amount;
    }
    isGreaterThanOrEqual(other) {
        this.ensureSameCurrency(other);
        return this.amount >= other.amount;
    }
    isLessThan(other) {
        this.ensureSameCurrency(other);
        return this.amount < other.amount;
    }
    isLessThanOrEqual(other) {
        this.ensureSameCurrency(other);
        return this.amount <= other.amount;
    }
    equals(other) {
        return this.amount === other.amount && this.currency === other.currency;
    }
    isZero() {
        return this.amount === 0;
    }
    ensureSameCurrency(other) {
        if (this.currency !== other.currency) {
            throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
        }
    }
    toString() {
        return `${this.amount.toFixed(2)} ${this.currency}`;
    }
    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency,
        };
    }
}
exports.Money = Money;
//# sourceMappingURL=money.vo.js.map