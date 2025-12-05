import { IQuery } from '@nestjs/cqrs';
export declare class LoginQuery implements IQuery {
    readonly email: string;
    readonly password: string;
    constructor(email: string, password: string);
}
