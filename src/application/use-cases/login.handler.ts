import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoginQuery } from '../queries/login.query.js';
import { AuthService } from '../../infrastructure/auth/auth.service.js';

@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery> {
  constructor(private readonly authService: AuthService) {}

  async execute(query: LoginQuery): Promise<{ accessToken: string; user: any }> {
    return this.authService.login(query.email, query.password);
  }
}
