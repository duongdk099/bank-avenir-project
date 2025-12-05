import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from '../interface/http/controllers/auth.controller.js';
import { RegisterUserHandler } from './use-cases/register-user.handler.js';
import { LoginHandler } from './use-cases/login.handler.js';
import { AuthModule } from '../infrastructure/auth/auth.module.js';
import { EventStoreModule } from '../infrastructure/event-store/event-store.module.js';
import { PrismaModule } from '../infrastructure/database/prisma/prisma.module.js';

const CommandHandlers = [RegisterUserHandler];
const QueryHandlers = [LoginHandler];

@Module({
  imports: [CqrsModule, AuthModule, EventStoreModule, PrismaModule],
  controllers: [AuthController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class UserModule {}
