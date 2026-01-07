import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service.js';

/**
 * Equilibrium Price Calculator Domain Service
 *
 * Selon le sujet:
 * "Le cours est calculé en fonction du prix d'équilibre entre un prix de vente
 * et un prix d'achat, selon le carnet d'ordre global pour une action."
 *
 * Méthodes de calcul du prix d'équilibre:
 * 1. Mid-Point Price: (meilleur prix d'achat + meilleur prix de vente) / 2
 * 2. Weighted Average: Moyenne pondérée par les volumes
 * 3. Last Trade Price: Dernier prix d'exécution
 *
 * Nous utilisons une combinaison de ces méthodes pour un prix d'équilibre réaliste.
 */
@Injectable()
export class EquilibriumPriceService {
  private readonly logger = new Logger(EquilibriumPriceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcule le prix d'équilibre pour une action selon le carnet d'ordres
   *
   * Algorithme:
   * 1. Si des trades récents existent: utiliser le dernier prix d'exécution
   * 2. Sinon, calculer le mid-point entre le meilleur BID et meilleur ASK
   * 3. Si pas de carnet d'ordres: garder le prix actuel
   *
   * @param securityId ID de l'action
   * @returns Le prix d'équilibre calculé
   */
  async calculateEquilibriumPrice(securityId: string): Promise<number | null> {
    // 1. Récupérer le dernier trade exécuté (prix le plus récent)
    const lastTrade = await this.prisma.trade.findFirst({
      where: { securityId },
      orderBy: { executedAt: 'desc' },
    });

    if (lastTrade) {
      this.logger.debug(
        `Equilibrium price for ${securityId}: ${lastTrade.price.toNumber()}€ (last trade)`
      );
      return lastTrade.price.toNumber();
    }

    // 2. Si pas de trade récent, calculer selon le carnet d'ordres
    const bestBid = await this.prisma.order.findFirst({
      where: {
        securityId,
        type: 'BUY',
        status: 'PENDING',
      },
      orderBy: { price: 'desc' }, // Meilleur prix d'achat (le plus haut)
    });

    const bestAsk = await this.prisma.order.findFirst({
      where: {
        securityId,
        type: 'SELL',
        status: 'PENDING',
      },
      orderBy: { price: 'asc' }, // Meilleur prix de vente (le plus bas)
    });

    // Si on a les deux côtés du marché
    if (bestBid && bestAsk) {
      const bidPrice = bestBid.price.toNumber();
      const askPrice = bestAsk.price.toNumber();

      // Prix d'équilibre = mid-point
      const equilibriumPrice = (bidPrice + askPrice) / 2;

      this.logger.debug(
        `Equilibrium price for ${securityId}: ${equilibriumPrice.toFixed(2)}€ ` +
        `(bid: ${bidPrice}€, ask: ${askPrice}€)`
      );

      return equilibriumPrice;
    }

    // Si seulement un côté du marché existe
    if (bestBid) {
      const price = bestBid.price.toNumber();
      this.logger.debug(
        `Equilibrium price for ${securityId}: ${price}€ (only bid side)`
      );
      return price;
    }

    if (bestAsk) {
      const price = bestAsk.price.toNumber();
      this.logger.debug(
        `Equilibrium price for ${securityId}: ${price}€ (only ask side)`
      );
      return price;
    }

    // Aucun carnet d'ordres: retourner null
    this.logger.debug(`No equilibrium price available for ${securityId} (no orders)`);
    return null;
  }

  /**
   * Met à jour le prix actuel (currentPrice) d'une action selon le carnet d'ordres
   * À appeler après chaque exécution d'ordre
   */
  async updateSecurityPrice(securityId: string): Promise<void> {
    const equilibriumPrice = await this.calculateEquilibriumPrice(securityId);

    if (equilibriumPrice !== null) {
      await this.prisma.security.update({
        where: { id: securityId },
        data: {
          currentPrice: equilibriumPrice,
          lastUpdated: new Date(),
        },
      });

      this.logger.log(
        `Updated security ${securityId} price to ${equilibriumPrice.toFixed(2)}€`
      );
    }
  }

  /**
   * Calcule le prix d'équilibre avec volume pondéré (VWAP-like)
   * Plus sophistiqué: prend en compte les volumes sur plusieurs niveaux de prix
   */
  async calculateVolumeWeightedPrice(
    securityId: string,
    depthLevels: number = 5
  ): Promise<number | null> {
    // Ordres d'achat (bid side)
    const buyOrders = await this.prisma.order.findMany({
      where: {
        securityId,
        type: 'BUY',
        status: 'PENDING',
      },
      orderBy: { price: 'desc' },
      take: depthLevels,
    });

    // Ordres de vente (ask side)
    const sellOrders = await this.prisma.order.findMany({
      where: {
        securityId,
        type: 'SELL',
        status: 'PENDING',
      },
      orderBy: { price: 'asc' },
      take: depthLevels,
    });

    if (buyOrders.length === 0 && sellOrders.length === 0) {
      return null;
    }

    // Calcul VWAP pour chaque côté
    let totalBuyValue = 0;
    let totalBuyVolume = 0;
    for (const order of buyOrders) {
      const price = order.price.toNumber();
      const volume = order.remainingQuantity;
      totalBuyValue += price * volume;
      totalBuyVolume += volume;
    }

    let totalSellValue = 0;
    let totalSellVolume = 0;
    for (const order of sellOrders) {
      const price = order.price.toNumber();
      const volume = order.remainingQuantity;
      totalSellValue += price * volume;
      totalSellVolume += volume;
    }

    // Prix moyen pondéré des deux côtés
    const vwapBuy = totalBuyVolume > 0 ? totalBuyValue / totalBuyVolume : 0;
    const vwapSell = totalSellVolume > 0 ? totalSellValue / totalSellVolume : 0;

    if (vwapBuy > 0 && vwapSell > 0) {
      return (vwapBuy + vwapSell) / 2;
    }

    return vwapBuy > 0 ? vwapBuy : vwapSell > 0 ? vwapSell : null;
  }

  /**
   * Obtient le spread (écart) entre le meilleur BID et le meilleur ASK
   * Utile pour évaluer la liquidité du marché
   */
  async getSpread(securityId: string): Promise<{
    bestBid: number | null;
    bestAsk: number | null;
    spread: number | null;
    spreadPercent: number | null;
  }> {
    const bestBid = await this.prisma.order.findFirst({
      where: { securityId, type: 'BUY', status: 'PENDING' },
      orderBy: { price: 'desc' },
    });

    const bestAsk = await this.prisma.order.findFirst({
      where: { securityId, type: 'SELL', status: 'PENDING' },
      orderBy: { price: 'asc' },
    });

    const bidPrice = bestBid ? bestBid.price.toNumber() : null;
    const askPrice = bestAsk ? bestAsk.price.toNumber() : null;

    let spread: number | null = null;
    let spreadPercent: number | null = null;

    if (bidPrice && askPrice) {
      spread = askPrice - bidPrice;
      const midPrice = (bidPrice + askPrice) / 2;
      spreadPercent = (spread / midPrice) * 100;
    }

    return {
      bestBid: bidPrice,
      bestAsk: askPrice,
      spread,
      spreadPercent,
    };
  }

  /**
   * Récupère le carnet d'ordres complet avec profondeur
   * Utile pour l'affichage côté client
   */
  async getOrderBookDepth(securityId: string, levels: number = 10): Promise<{
    bids: Array<{ price: number; quantity: number; totalQuantity: number }>;
    asks: Array<{ price: number; quantity: number; totalQuantity: number }>;
    equilibriumPrice: number | null;
  }> {
    const buyOrders = await this.prisma.order.findMany({
      where: { securityId, type: 'BUY', status: 'PENDING' },
      orderBy: { price: 'desc' },
      take: levels,
    });

    const sellOrders = await this.prisma.order.findMany({
      where: { securityId, type: 'SELL', status: 'PENDING' },
      orderBy: { price: 'asc' },
      take: levels,
    });

    // Agréger les ordres par niveau de prix
    const bids = this.aggregateOrdersByPrice(buyOrders);
    const asks = this.aggregateOrdersByPrice(sellOrders);

    const equilibriumPrice = await this.calculateEquilibriumPrice(securityId);

    return { bids, asks, equilibriumPrice };
  }

  private aggregateOrdersByPrice(orders: any[]): Array<{
    price: number;
    quantity: number;
    totalQuantity: number;
  }> {
    const priceMap = new Map<number, number>();

    for (const order of orders) {
      const price = order.price.toNumber();
      const quantity = order.remainingQuantity;
      priceMap.set(price, (priceMap.get(price) || 0) + quantity);
    }

    let cumulativeQuantity = 0;
    return Array.from(priceMap.entries())
      .sort((a, b) => b[0] - a[0]) // Tri par prix décroissant
      .map(([price, quantity]) => {
        cumulativeQuantity += quantity;
        return {
          price,
          quantity,
          totalQuantity: cumulativeQuantity,
        };
      });
  }
}
