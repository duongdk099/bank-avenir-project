import { ICommand } from '@nestjs/cqrs';
export declare class CreateStockCommand implements ICommand {
    readonly symbol: string;
    readonly name: string;
    readonly type: string;
    readonly exchange: string | undefined;
    readonly currentPrice: number;
    readonly currency: string;
    constructor(symbol: string, name: string, type: string, exchange: string | undefined, currentPrice: number, currency: string);
}
export declare class UpdateStockAvailabilityCommand implements ICommand {
    readonly symbol: string;
    readonly isAvailable: boolean;
    constructor(symbol: string, isAvailable: boolean);
}
export declare class DeleteStockCommand implements ICommand {
    readonly symbol: string;
    constructor(symbol: string);
}
