import { ICommand } from '@nestjs/cqrs';

export class RegisterUserCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly city?: string,
    public readonly postalCode?: string,
    public readonly country?: string,
    public readonly dateOfBirth?: Date,
  ) {}
}
