import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RegisterUserCommand } from '../commands/register-user.command.js';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';
import { AuthService } from '../../infrastructure/auth/auth.service.js';
import { EventStore } from '../../infrastructure/event-store/event-store.service.js';
import { UserAggregate } from '../../domain/entities/user.aggregate.js';
import { EmailService } from '../../infrastructure/services/email.service.js';
import { EmailVerificationToken } from '../../domain/value-objects/email-verification-token.vo.js';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ userId: string }> {
    // Defensive validation: ensure required data present
    if (!command.email) {
      throw new BadRequestException('email is required');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: command.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(command.password);

    // Create user aggregate
    const userId = uuidv4();
    const userAggregate = UserAggregate.register(
      userId,
      command.email,
      passwordHash,
      'CLIENT',
    );

    // Save events to event store
    await this.eventStore.save(userAggregate, 'User');

    // Create read model projections
    await this.prisma.user.create({
      data: {
        id: userId,
        email: command.email,
        passwordHash: passwordHash,
        role: 'CLIENT',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: command.firstName,
            lastName: command.lastName,
            phone: command.phone,
            address: command.address,
            city: command.city,
            postalCode: command.postalCode,
            country: command.country,
            dateOfBirth: command.dateOfBirth,
          },
        },
      },
    });

    // Generate email confirmation token (simple hex token, 64 chars)
    const verificationToken = EmailVerificationToken.generate();
    const confirmationToken = verificationToken.getValue();

    // Save confirmation token in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: confirmationToken,
      },
    });

    // Send confirmation email
    try {
      await this.emailService.sendConfirmationEmail(
        command.email,
        confirmationToken,
        `${command.firstName} ${command.lastName}`,
      );
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send confirmation email:', error);
    }

    return { userId, confirmationToken } as any;
  }
}
