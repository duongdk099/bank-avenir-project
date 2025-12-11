import { CommandBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
export declare class AdminController {
    private readonly prisma;
    private readonly commandBus;
    constructor(prisma: PrismaService, commandBus: CommandBus);
    createSecurity(dto: {
        symbol: string;
        name: string;
        type: string;
        exchange?: string;
        currentPrice: number;
        currency?: string;
    }): Promise<{
        message: string;
        security: {
            symbol: string;
            id: string;
            name: string;
            type: string;
            currency: string;
            exchange: string | null;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            isAvailable: boolean;
            lastUpdated: Date;
        };
    }>;
    updateSecurityPrice(id: string, dto: {
        price: number;
    }): Promise<{
        message: string;
        security: {
            symbol: string;
            id: string;
            name: string;
            type: string;
            currency: string;
            exchange: string | null;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            isAvailable: boolean;
            lastUpdated: Date;
        };
    }>;
    getAllSecurities(): Promise<{
        symbol: string;
        id: string;
        name: string;
        type: string;
        currency: string;
        exchange: string | null;
        currentPrice: import("@prisma/client-runtime-utils").Decimal;
        isAvailable: boolean;
        lastUpdated: Date;
    }[]>;
    updateSavingsRate(dto: {
        accountType: string;
        rate: number;
        minBalance: number;
        effectiveDate: string;
    }): Promise<{
        message: string;
        savingsRate: {
            id: string;
            createdAt: Date;
            accountType: string;
            rate: import("@prisma/client-runtime-utils").Decimal;
            minBalance: import("@prisma/client-runtime-utils").Decimal;
            effectiveDate: Date;
        };
    }>;
    getSavingsRates(): Promise<{
        id: string;
        createdAt: Date;
        accountType: string;
        rate: import("@prisma/client-runtime-utils").Decimal;
        minBalance: import("@prisma/client-runtime-utils").Decimal;
        effectiveDate: Date;
    }[]>;
    updateUserRole(id: string, dto: {
        role: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
    getAllUsers(): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        status: import("@prisma/client").$Enums.UserStatus;
        profile: {
            id: string;
            userId: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            address: string | null;
            city: string | null;
            postalCode: string | null;
            country: string | null;
            dateOfBirth: Date | null;
        } | null;
        accountsCount: number;
        accounts: {
            id: string;
            status: string;
            iban: string;
            accountType: import("@prisma/client").$Enums.AccountType;
            balance: import("@prisma/client-runtime-utils").Decimal;
        }[];
        createdAt: Date;
    }[]>;
    getDashboardStats(): Promise<{
        users: {
            total: number;
        };
        accounts: {
            total: number;
            totalBalance: number | import("@prisma/client-runtime-utils").Decimal;
        };
        orders: {
            total: number;
            pending: number;
        };
        loans: {
            total: number;
            active: number;
        };
    }>;
    createStock(dto: {
        symbol: string;
        name: string;
        type: string;
        exchange?: string;
        currentPrice: number;
        currency?: string;
    }): Promise<any>;
    updateStockAvailability(symbol: string, dto: {
        isAvailable: boolean;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteStock(symbol: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createAccountForClient(dto: {
        userId: string;
        accountType: string;
        initialDeposit: number;
        name?: string;
    }): Promise<{
        message: string;
        accountId: any;
        iban: any;
    }>;
    renameAccount(id: string, dto: {
        newName: string;
        requestedBy: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    banAccount(id: string, dto: {
        reason: string;
        bannedBy: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    closeAccount(id: string, dto: {
        reason: string;
        closedBy: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
