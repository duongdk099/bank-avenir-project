export class IBAN {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): IBAN {
    if (!IBAN.validate(value)) {
      throw new Error(`Invalid IBAN: ${value}`);
    }
    return new IBAN(value);
  }

  /**
   * Generates a valid IBAN for AVENIR bank (France)
   * Format: FRkk BBBB BGGG CCCC CCCC CCCC CKK
   * Where:
   * - FR = Country code
   * - kk = Check digits (calculated using Modulo 97)
   * - BBBBB = Bank code (5 digits for AVENIR: 12345)
   * - GGG = Branch code (3 digits: 678)
   * - CCCCCCCCCCC = Account number (11 digits)
   * - KK = RIB key (2 digits)
   * Total BBAN: 23 characters (5+5+11+2)
   */
  static generate(accountNumber: string, ribKey: string = '00'): IBAN {
    const bankCode = '12345'; // AVENIR bank code (5 digits)
    const branchCode = '67890'; // Branch code (5 digits)
    
    // Ensure account number is 11 digits
    const paddedAccountNumber = accountNumber.padStart(11, '0');
    
    // Ensure RIB key is 2 digits
    const paddedRibKey = ribKey.padStart(2, '0');
    
    // BBAN (Basic Bank Account Number) = Bank Code + Branch Code + Account Number + RIB Key
    // Total: 5 + 5 + 11 + 2 = 23 characters
    const bban = bankCode + branchCode + paddedAccountNumber + paddedRibKey;
    
    // Calculate check digits using Modulo 97
    const checkDigits = IBAN.calculateCheckDigits(bban, 'FR');
    
    // Construct final IBAN
    const iban = `FR${checkDigits}${bban}`;
    
    return new IBAN(iban);
  }

  /**
   * Validates IBAN using Modulo 97 algorithm
   * As per ISO 13616 specification
   */
  static validate(iban: string): boolean {
    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    
    // Check length (France IBAN is 27 characters)
    if (cleanIban.length !== 27) {
      return false;
    }
    
    // Check format: FR followed by 2 digits, then 23 alphanumeric characters
    if (!/^FR\d{25}$/.test(cleanIban)) {
      return false;
    }
    
    // Rearrange: Move first 4 characters to end
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
    
    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    const numericString = rearranged
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          // A-Z
          return (code - 55).toString();
        }
        return char;
      })
      .join('');
    
    // Calculate modulo 97
    return IBAN.mod97(numericString) === 1;
  }

  /**
   * Calculates check digits for IBAN using Modulo 97
   */
  private static calculateCheckDigits(bban: string, countryCode: string): string {
    // Create IBAN with check digits set to '00'
    const provisionalIban = bban + countryCode + '00';
    
    // Replace letters with numbers
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
    
    // Calculate modulo 97
    const remainder = IBAN.mod97(numericString);
    
    // Check digits = 98 - remainder
    const checkDigits = 98 - remainder;
    
    return checkDigits.toString().padStart(2, '0');
  }

  /**
   * Calculates modulo 97 for large numbers (represented as strings)
   * This is necessary because JavaScript numbers lose precision with large integers
   */
  private static mod97(numericString: string): number {
    let remainder = 0;
    
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
    }
    
    return remainder;
  }

  getValue(): string {
    return this.value;
  }

  /**
   * Returns formatted IBAN with spaces for readability
   * Example: FR76 1234 5678 9012 3456 7890 123
   */
  getFormatted(): string {
    return this.value.replace(/(.{4})/g, '$1 ').trim();
  }

  equals(other: IBAN): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
