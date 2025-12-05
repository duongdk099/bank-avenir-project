import { IQueryHandler } from '@nestjs/cqrs';
import { LoginQuery } from '../queries/login.query.js';
import { AuthService } from '../../infrastructure/auth/auth.service.js';
export declare class LoginHandler implements IQueryHandler<LoginQuery> {
    private readonly authService;
    constructor(authService: AuthService);
    execute(query: LoginQuery): Promise<{
        accessToken: string;
        user: any;
    }>;
}
