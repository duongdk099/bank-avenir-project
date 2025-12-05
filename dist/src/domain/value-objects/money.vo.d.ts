export declare class Money {
    private readonly amount;
    private readonly currency;
    private constructor();
    static create(amount: number, currency?: string): Money;
    static zero(currency?: string): Money;
    getAmount(): number;
    getCurrency(): string;
    add(other: Money): Money;
    subtract(other: Money): Money;
    multiply(multiplier: number): Money;
    divide(divisor: number): Money;
    isGreaterThan(other: Money): boolean;
    isGreaterThanOrEqual(other: Money): boolean;
    isLessThan(other: Money): boolean;
    isLessThanOrEqual(other: Money): boolean;
    equals(other: Money): boolean;
    isZero(): boolean;
    private ensureSameCurrency;
    toString(): string;
    toJSON(): {
        amount: number;
        currency: string;
    };
}
