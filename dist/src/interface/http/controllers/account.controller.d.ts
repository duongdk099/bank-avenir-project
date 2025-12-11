import { CommandBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
import { InterestCalculationService } from '../../../application/services/interest-calculation.service.js';
export declare class AccountController {
    private readonly commandBus;
    private readonly prisma;
    private readonly interestService;
    constructor(commandBus: CommandBus, prisma: PrismaService, interestService: InterestCalculationService);
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
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        userId: string;
        iban: string;
        accountType: import("@prisma/client").$Enums.AccountType;
        balance: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
    }) | null>;
    getUserAccounts(userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
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
}
