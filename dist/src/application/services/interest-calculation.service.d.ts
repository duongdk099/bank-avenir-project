import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
export declare class InterestCalculationService {
    private readonly prisma;
    private readonly eventStore;
    private readonly logger;
    constructor(prisma: PrismaService, eventStore: EventStore);
    calculateDailyInterest(): Promise<void>;
    applyInterestToAccount(accountId: string): Promise<void>;
    calculateInterestNow(): Promise<{
        processed: number;
        errors: number;
    }>;
}
