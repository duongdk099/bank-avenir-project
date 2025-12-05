export declare class IBAN {
    private readonly value;
    private constructor();
    static create(value: string): IBAN;
    static generate(accountNumber: string, ribKey?: string): IBAN;
    static validate(iban: string): boolean;
    private static calculateCheckDigits;
    private static mod97;
    getValue(): string;
    getFormatted(): string;
    equals(other: IBAN): boolean;
    toString(): string;
}
