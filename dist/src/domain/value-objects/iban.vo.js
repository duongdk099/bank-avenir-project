"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IBAN = void 0;
class IBAN {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!IBAN.validate(value)) {
            throw new Error(`Invalid IBAN: ${value}`);
        }
        return new IBAN(value);
    }
    static generate(accountNumber, ribKey = '00') {
        const bankCode = '12345';
        const branchCode = '67890';
        const paddedAccountNumber = accountNumber.padStart(11, '0');
        const paddedRibKey = ribKey.padStart(2, '0');
        const bban = bankCode + branchCode + paddedAccountNumber + paddedRibKey;
        const checkDigits = IBAN.calculateCheckDigits(bban, 'FR');
        const iban = `FR${checkDigits}${bban}`;
        return new IBAN(iban);
    }
    static validate(iban) {
        const cleanIban = iban.replace(/\s/g, '').toUpperCase();
        if (cleanIban.length !== 27) {
            return false;
        }
        if (!/^FR\d{25}$/.test(cleanIban)) {
            return false;
        }
        const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
        const numericString = rearranged
            .split('')
            .map(char => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                return (code - 55).toString();
            }
            return char;
        })
            .join('');
        return IBAN.mod97(numericString) === 1;
    }
    static calculateCheckDigits(bban, countryCode) {
        const provisionalIban = bban + countryCode + '00';
        const numericString = provisionalIban
            .split('')
            .map(char => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) {
                return (code - 55).toString();
            }
            return char;
        })
            .join('');
        const remainder = IBAN.mod97(numericString);
        const checkDigits = 98 - remainder;
        return checkDigits.toString().padStart(2, '0');
    }
    static mod97(numericString) {
        let remainder = 0;
        for (let i = 0; i < numericString.length; i++) {
            remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
        }
        return remainder;
    }
    getValue() {
        return this.value;
    }
    getFormatted() {
        return this.value.replace(/(.{4})/g, '$1 ').trim();
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.IBAN = IBAN;
//# sourceMappingURL=iban.vo.js.map