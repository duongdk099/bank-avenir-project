import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  GenerateEmailVerificationTokenCommand,
  VerifyEmailCommand,
  ResendVerificationEmailCommand,
} from '../commands/email-verification.commands.js';
import {
  EmailVerificationTokenGeneratedEvent,
  EmailVerifiedEvent,
} from '../../domain/entities/events/email-verification.events.js';
import { EmailVerificationToken } from '../../domain/value-objects/email-verification-token.vo.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';

/**
 * Command Handler: Generate Email Verification Token
 * Generates a secure token and stores it in the database
 */
@Injectable()
@CommandHandler(GenerateEmailVerificationTokenCommand)
export class GenerateEmailVerificationTokenHandler
  implements ICommandHandler<GenerateEmailVerificationTokenCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: GenerateEmailVerificationTokenCommand): Promise<string> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new token
    const token = EmailVerificationToken.generate();

    // Update user with verification token
    await this.prisma.user.update({
      where: { id: command.userId },
      data: {
        emailVerificationToken: token.getValue(),
      },
    });

    // Publish event
    const event = new EmailVerificationTokenGeneratedEvent(
      command.userId,
      token.getValue(),
      command.email,
    );
    this.eventBus.publish(event);

    return token.getValue();
  }
}

/**
 * Command Handler: Verify Email
 * Verifies the user's email using the provided token
 */
@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<void> {
    // Find user by ID and token
    const user = await this.prisma.user.findFirst({
      where: {
        id: command.userId,
        emailVerificationToken: command.token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Update user as verified
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null, // Clear the token
      },
    });

    // Publish event
    const event = new EmailVerifiedEvent(user.id, user.email);
    this.eventBus.publish(event);
  }
}

/**
 * Command Handler: Resend Verification Email
 * Generates a new token and resends verification email
 */
@Injectable()
@CommandHandler(ResendVerificationEmailCommand)
export class ResendVerificationEmailHandler
  implements ICommandHandler<ResendVerificationEmailCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ResendVerificationEmailCommand): Promise<string> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new token
    const token = EmailVerificationToken.generate();

    // Update user with new token
    await this.prisma.user.update({
      where: { id: command.userId },
      data: {
        emailVerificationToken: token.getValue(),
      },
    });

    // Publish event
    const event = new EmailVerificationTokenGeneratedEvent(
      command.userId,
      token.getValue(),
      user.email,
    );
    this.eventBus.publish(event);

    return token.getValue();
  }
}
