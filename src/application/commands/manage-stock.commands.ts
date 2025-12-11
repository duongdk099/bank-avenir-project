import { ICommand } from '@nestjs/cqrs';

/**
 * Create Stock Command (Director only)
 */
export class CreateStockCommand implements ICommand {
  constructor(
    public readonly symbol: string,
    public readonly name: string,
    public readonly type: string,
    public readonly exchange: string | undefined,
    public readonly currentPrice: number,
    public readonly currency: string,
  ) {}
}

/**
 * Update Stock Availability Command (Director only)
 */
export class UpdateStockAvailabilityCommand implements ICommand {
  constructor(
    public readonly symbol: string,
    public readonly isAvailable: boolean,
  ) {}
}

/**
 * Delete Stock Command (Director only)
 */
export class DeleteStockCommand implements ICommand {
  constructor(
    public readonly symbol: string,
  ) {}
}
