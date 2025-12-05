import { Injectable } from '@nestjs/common';
import { IBAN } from '../../domain/value-objects/iban.vo.js';
import { PrismaService } from '../database/prisma/prisma.service.js';

@Injectable()
export class IbanService {
  private static accountCounter = 1;
  
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a unique IBAN for a new account
   * Uses sequential account numbering to ensure uniqueness
   */
  async generateIban(): Promise<IBAN> {
    let iban: IBAN;
    let isUnique = false;

    // Keep generating until we get a unique IBAN
    while (!isUnique) {
      // Generate sequential account number
      const accountNumber = IbanService.accountCounter.toString();
      IbanService.accountCounter++;

      // Generate IBAN using Modulo 97 algorithm
      iban = IBAN.generate(accountNumber);

      // Check if IBAN already exists in database
      const existing = await this.prisma.bankAccount.findUnique({
        where: { iban: iban.getValue() },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return iban!;
  }

  /**
   * Validates an IBAN
   */
  validateIban(iban: string): boolean {
    return IBAN.validate(iban);
  }

  /**
   * Checks if an IBAN belongs to AVENIR bank (internal)
   */
  isInternalIban(iban: string): boolean {
    const cleanIban = iban.replace(/\s/g, '');
    const bankCode = cleanIban.substring(4, 9);
    return cleanIban.startsWith('FR') && bankCode === '12345';
  }

  /**
   * Finds account by IBAN
   */
  async findAccountByIban(iban: string): Promise<any> {
    return this.prisma.bankAccount.findUnique({
      where: { iban: iban.replace(/\s/g, '') },
    });
  }
}
