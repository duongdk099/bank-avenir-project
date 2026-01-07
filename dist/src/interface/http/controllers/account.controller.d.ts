import { CommandBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { InterestCalculationService } from '../../../application/services/interest-calculation.service.js';
export declare class AccountController {
    private readonly commandBus;
    private readonly prisma;
    private readonly interestService;
    constructor(commandBus: CommandBus, prisma: PrismaService, interestService: InterestCalculationService);
    transfer(dto: {
        fromAccountId: string;
        toIban: string;
        amount: number;
        description?: string;
    }): Promise<{
        message: string;
        transferId: string;
        newBalance: number;
    }>;
    openAccount(dto: {
        userId: string;
        accountType: string;
        initialDeposit?: number;
    }): Promise<any>;
    getAccount(id: string): Promise<({
        operations: {
            id: string;
            createdAt: Date;
            type: import("@prisma/client").$Enums.OperationType;
            accountId: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
            description: string | null;
            senderIban: string | null;
            recipientIban: string | null;
            balanceAfter: import("@prisma/client-runtime-utils").Decimal;
        }[];
    } & {
        name: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        iban: string;
        accountType: import("@prisma/client").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
    }) | null>;
    getUserAccounts(userId: string): Promise<{
        name: string | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        iban: string;
        accountType: import("@prisma/client").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
    }[]>;
    calculateInterest(): Promise<{
        processed: number;
        errors: number;
        message: string;
    }>;
    renameAccount(id: string, dto: {
        newName: string;
        userId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteAccount(id: string, dto: {
        userId: string;
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
