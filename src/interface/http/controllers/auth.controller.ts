import { Body, Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../../../application/commands/register-user.command.js';
import { LoginQuery } from '../../../application/queries/login.query.js';
import { RegisterUserDto } from '../../../application/dto/register-user.dto.js';
import { LoginDto } from '../../../application/dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const command = new RegisterUserCommand(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.phone,
      dto.address,
      dto.city,
      dto.postalCode,
      dto.country,
      dto.dateOfBirth,
    );

    const result = await this.commandBus.execute(command);
    return {
      message: 'User registered successfully',
      userId: result.userId,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const query = new LoginQuery(dto.email, dto.password);
    return this.queryBus.execute(query);
  }
}
