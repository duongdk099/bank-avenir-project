import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserDto } from '../../../application/dto/register-user.dto.js';
import { LoginDto } from '../../../application/dto/login.dto.js';
export declare class AuthController {
    private readonly commandBus;
    private readonly queryBus;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    register(dto: RegisterUserDto): Promise<{
        message: string;
        userId: any;
    }>;
    login(dto: LoginDto): Promise<any>;
}
