import { IEventHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
export declare class PrivateMessageSentEvent {
    readonly conversationId: string;
    readonly senderId: string;
    readonly receiverId: string;
    readonly content: string;
    readonly occurredOn: Date;
    constructor(conversationId: string, senderId: string, receiverId: string, content: string, occurredOn?: Date);
    get eventType(): string;
}
export declare class PrivateMessageSentHandler implements IEventHandler<PrivateMessageSentEvent> {
    private readonly prisma;
    constructor(prisma: PrismaService);
    handle(event: PrivateMessageSentEvent): Promise<void>;
}
