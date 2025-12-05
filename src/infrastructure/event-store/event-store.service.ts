import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../database/prisma/prisma.service.js';
import { IDomainEvent } from '../../domain/entities/domain-event.interface.js';
import { AggregateRoot } from '../../domain/entities/aggregate-root.js';

@Injectable()
export class EventStore {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async saveEvents(
    aggregateId: string,
    aggregateType: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Check for concurrency conflicts (optimistic locking)
        const lastEvent = await tx.event.findFirst({
          where: {
            aggregateId,
            aggregateType,
          },
          orderBy: {
            version: 'desc',
          },
        });

        const currentVersion = lastEvent?.version ?? -1;

        if (currentVersion !== expectedVersion - events.length) {
          throw new ConflictException(
            `Concurrency conflict: Expected version ${expectedVersion - events.length}, but current version is ${currentVersion}`,
          );
        }

        // Save events with incrementing versions
        let version = expectedVersion - events.length + 1;
        for (const event of events) {
          await tx.event.create({
            data: {
              aggregateId,
              aggregateType,
              version,
              type: event.eventType,
              payload: event as any,
              createdAt: event.occurredOn,
            },
          });
          version++;
        }
      });

      // Publish events to the event bus after successful persistence
      events.forEach((event) => {
        this.eventBus.publish(event);
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to save events: ${error.message}`);
    }
  }

  async getEventsForAggregate(
    aggregateId: string,
    aggregateType: string,
  ): Promise<IDomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: {
        aggregateId,
        aggregateType,
      },
      orderBy: {
        version: 'asc',
      },
    });

    if (events.length === 0) {
      throw new NotFoundException(
        `No events found for aggregate ${aggregateId}`,
      );
    }

    return events.map((event) => event.payload as unknown as IDomainEvent);
  }

  async save(aggregate: AggregateRoot, aggregateType: string): Promise<void> {
    const uncommittedEvents = aggregate.getUncommittedEvents();
    const expectedVersion = aggregate.getVersion();

    await this.saveEvents(
      aggregate.getId(),
      aggregateType,
      uncommittedEvents,
      expectedVersion,
    );

    aggregate.markEventsAsCommitted();
  }
}
