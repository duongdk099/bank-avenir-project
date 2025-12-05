import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service.js';
export declare class AdminController {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
