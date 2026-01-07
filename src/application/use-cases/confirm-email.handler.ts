import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfirmEmailCommand } from '../commands/confirm-email.command.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { UserAggregate } from '../../domain/entities/user.aggregate.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { EmailVerificationToken } from '../../domain/value-objects/email-verification-token.vo.js';

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailHandler implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    private readonly eventStore: EventStore,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ConfirmEmailCommand): Promise<{ message: string; userId: string }> {
    try {
      // Validate token format
      EmailVerificationToken.fromString(command.token);

      // Find user by verification token
      const user = await this.prisma.user.findFirst({
        where: { emailVerificationToken: command.token },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid or expired confirmation token');
      }

      const userId = user.id;

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

      // Update read model - mark email as verified
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null, // Clear the token
        },
      });

      return {
        message: 'Email confirmed successfully',
        userId,
      };
    } catch (error) {
      if (error.message && error.message.includes('Invalid verification token')) {
        throw new UnauthorizedException('Invalid confirmation token format');
      }
      throw error;
    }
  }
}
