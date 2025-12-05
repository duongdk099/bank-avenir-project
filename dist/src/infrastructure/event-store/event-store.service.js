"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStore = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const prisma_service_js_1 = require("../database/prisma/prisma.service.js");
let EventStore = class EventStore {
    prisma;
    eventBus;
    constructor(prisma, eventBus) {
        this.prisma = prisma;
        this.eventBus = eventBus;
    }
    async saveEvents(aggregateId, aggregateType, events, expectedVersion) {
        if (events.length === 0) {
            return;
        }
        try {
            await this.prisma.$transaction(async (tx) => {
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
                    throw new common_1.ConflictException(`Concurrency conflict: Expected version ${expectedVersion - events.length}, but current version is ${currentVersion}`);
                }
                let version = expectedVersion - events.length + 1;
                for (const event of events) {
                    await tx.event.create({
                        data: {
                            aggregateId,
                            aggregateType,
                            version,
                            type: event.eventType,
                            payload: event,
                            createdAt: event.occurredOn,
                        },
                    });
                    version++;
                }
            });
            events.forEach((event) => {
                this.eventBus.publish(event);
            });
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new Error(`Failed to save events: ${error.message}`);
        }
    }
    async getEventsForAggregate(aggregateId, aggregateType) {
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
            throw new common_1.NotFoundException(`No events found for aggregate ${aggregateId}`);
        }
        return events.map((event) => event.payload);
    }
    async save(aggregate, aggregateType) {
        const uncommittedEvents = aggregate.getUncommittedEvents();
        const expectedVersion = aggregate.getVersion();
        await this.saveEvents(aggregate.getId(), aggregateType, uncommittedEvents, expectedVersion);
        aggregate.markEventsAsCommitted();
    }
};
exports.EventStore = EventStore;
exports.EventStore = EventStore = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        cqrs_1.EventBus])
], EventStore);
//# sourceMappingURL=event-store.service.js.map