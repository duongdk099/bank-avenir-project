import { CommandBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
export declare class LoanController {
    private readonly commandBus;
    private readonly prisma;
    constructor(commandBus: CommandBus, prisma: PrismaService);
    grantLoan(dto: {
        userId: string;
        accountId: string;
        principal: number;
        annualRate: number;
        termMonths: number;
        insuranceRate: number;
    }): Promise<any>;
    getLoan(id: string): Promise<({
        account: {
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
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        createdAt: Date;
        userId: string;
        accountId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        interestRate: import("@prisma/client-runtime-utils").Decimal;
        insuranceRate: import("@prisma/client-runtime-utils").Decimal;
        durationMonths: number;
        monthlyPayment: import("@prisma/client-runtime-utils").Decimal;
        approvalDate: Date | null;
        firstPaymentDate: Date | null;
    }) | null>;
    getLoanSchedule(id: string): Promise<{
        id: string;
        loanId: string;
        installmentNumber: number;
        dueDate: Date;
        principalAmount: import("@prisma/client-runtime-utils").Decimal;
        interestAmount: import("@prisma/client-runtime-utils").Decimal;
        insuranceAmount: import("@prisma/client-runtime-utils").Decimal;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        isPaid: boolean;
        paidDate: Date | null;
    }[]>;
    getUserLoans(userId: string): Promise<({
        account: {
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
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.LoanStatus;
        createdAt: Date;
        userId: string;
        accountId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        interestRate: import("@prisma/client-runtime-utils").Decimal;
        insuranceRate: import("@prisma/client-runtime-utils").Decimal;
        durationMonths: number;
        monthlyPayment: import("@prisma/client-runtime-utils").Decimal;
        approvalDate: Date | null;
        firstPaymentDate: Date | null;
    })[]>;
    calculatePayment(dto: {
        principal: number;
        annualRate: number;
        termMonths: number;
        insuranceRate: number;
    }): Promise<{
        monthlyPayment: number;
        monthlyPaymentWithoutInsurance: number;
        monthlyInsurance: number;
        totalAmount: number;
        totalInterest: number;
        totalInsurance: number;
    }>;
}
