import { ICommand } from '@nestjs/cqrs';
export declare class RegisterUserCommand implements ICommand {
    readonly email: string;
    readonly password: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone?: string | undefined;
    readonly address?: string | undefined;
    readonly city?: string | undefined;
    readonly postalCode?: string | undefined;
    readonly country?: string | undefined;
    readonly dateOfBirth?: Date | undefined;
    constructor(email: string, password: string, firstName: string, lastName: string, phone?: string | undefined, address?: string | undefined, city?: string | undefined, postalCode?: string | undefined, country?: string | undefined, dateOfBirth?: Date | undefined);
}
