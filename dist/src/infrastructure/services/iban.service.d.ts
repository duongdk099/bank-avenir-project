import { IBAN } from '../../domain/value-objects/iban.vo.js';
import { PrismaService } from '../database/prisma/prisma.service.js';
export declare class IbanService {
    private readonly prisma;
    private static accountCounter;
    constructor(prisma: PrismaService);
    generateIban(): Promise<IBAN>;
    validateIban(iban: string): boolean;
    isInternalIban(iban: string): boolean;
    findAccountByIban(iban: string): Promise<any>;
}
