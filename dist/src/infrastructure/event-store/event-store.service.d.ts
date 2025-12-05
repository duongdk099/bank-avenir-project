import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../database/prisma/prisma.service.js';
import { IDomainEvent } from '../../domain/entities/domain-event.interface.js';
import { AggregateRoot } from '../../domain/entities/aggregate-root.js';
export declare class EventStore {
    private readonly prisma;
    private readonly eventBus;
    constructor(prisma: PrismaService, eventBus: EventBus);
    saveEvents(aggregateId: string, aggregateType: string, events: IDomainEvent[], expectedVersion: number): Promise<void>;
    getEventsForAggregate(aggregateId: string, aggregateType: string): Promise<IDomainEvent[]>;
    save(aggregate: AggregateRoot, aggregateType: string): Promise<void>;
}
