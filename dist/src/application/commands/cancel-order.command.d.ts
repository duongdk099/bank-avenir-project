export declare class CancelOrderCommand {
    readonly orderId: string;
    readonly userId: string;
    readonly reason: string;
    constructor(orderId: string, userId: string, reason?: string);
}
