import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfirmEmailCommand } from '../commands/confirm-email.command.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { UserAggregate } from '../../domain/entities/user.aggregate.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailHandler implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly eventStore: EventStore,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<{ message: string; userId: string }> {
    try {
      // Verify and decode the token
      const payload = this.jwtService.verify(command.token);

      // Check token type
      if (payload.type !== 'email_confirmation') {
        throw new BadRequestException('Invalid confirmation token');
      }

      const userId = payload.userId;

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Load user aggregate from event store
      const events = await this.eventStore.getEventsForAggregate(userId, 'User');
      const userAggregate = new UserAggregate(userId);
      userAggregate.loadFromHistory(events);

      // Check if already confirmed
      if (userAggregate.isEmailConfirmed()) {
        return {
          message: 'Email already confirmed',
          userId,
        };
      }

      // Confirm email
      userAggregate.confirmEmail();

      // Save events
      await this.eventStore.save(userAggregate, 'User');

      // Update read model (optional - can be handled by projector)
      // For now, we'll keep the status in User table as is since email confirmation
      // is tracked in the aggregate state

      return {
        message: 'Email confirmed successfully',
        userId,
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid confirmation token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Confirmation token has expired');
      }
      throw error;
    }
  }
}
