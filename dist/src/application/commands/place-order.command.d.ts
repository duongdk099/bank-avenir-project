import { ICommand } from '@nestjs/cqrs';
export declare class PlaceOrderCommand implements ICommand {
    readonly userId: string;
    readonly accountId: string;
    readonly securityId: string;
    readonly type: string;
    readonly quantity: number;
    readonly price: number;
    constructor(userId: string, accountId: string, securityId: string, type: string, quantity: number, price: number);
}
