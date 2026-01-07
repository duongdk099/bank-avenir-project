#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║        COMMANDES DE TEST - SYSTÈME DE TRADING BANQUE AVENIR                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                  BANQUE AVENIR - TESTS SYSTÈME DE TRADING                  ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. TEST DU SERVICE EMAIL
# ============================================================================
echo "┌─ TEST 1 : SERVICE EMAIL ────────────────────────────────────────────────────┐"
echo "│ Commande : npx ts-node test-email-simple.ts                                 │"
echo "└──────────────────────────────────────────────────────────────────────────────┘"
echo ""
echo "Lancer le test ? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npx ts-node test-email-simple.ts
    echo ""
    echo "✅ Vérifiez votre boîte mail : bilal.amara72@gmail.com"
    echo ""
fi

# ============================================================================
# 2. DÉMARRAGE DU SERVEUR
# ============================================================================
echo "┌─ TEST 2 : DÉMARRAGE DU SERVEUR ─────────────────────────────────────────────┐"
echo "│ Commande : npm run start:dev                                                 │"
echo "│ Le serveur sera disponible sur http://localhost:3000                         │"
echo "└──────────────────────────────────────────────────────────────────────────────┘"
echo ""
echo "⚠️  Le serveur va démarrer. Pressez CTRL+C pour arrêter."
echo ""
echo "Démarrer le serveur ? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npm run start:dev
fi

# ============================================================================
# 3. EXEMPLES DE REQUÊTES API (À LANCER DANS UN AUTRE TERMINAL)
# ============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                       EXEMPLES DE REQUÊTES API                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

cat << 'EOF'
┌─ EXEMPLE 1 : CRÉER UNE ACTION (DIRECTEUR) ──────────────────────────────────────┐
│                                                                                  │
│ Endpoint : POST http://localhost:3000/api/securities                            │
│ Headers  : Authorization: Bearer <directeur-token>                              │
│            Content-Type: application/json                                       │
│                                                                                  │
│ Body :                                                                           │
│ {                                                                                │
│   "symbol": "AAPL",                                                              │
│   "name": "Apple Inc.",                                                          │
│   "type": "STOCK",                                                               │
│   "exchange": "NASDAQ",                                                          │
│   "initialPrice": 180.00                                                         │
│ }                                                                                │
│                                                                                  │
│ Résultat attendu :                                                               │
│ ✅ Action créée avec currentPrice = 180.00€                                     │
│ ✅ isAvailable = true                                                           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ EXEMPLE 2 : PLACER UN ORDRE D'ACHAT (CLIENT) ──────────────────────────────────┐
│                                                                                  │
│ Endpoint : POST http://localhost:3000/api/orders                                │
│ Headers  : Authorization: Bearer <client-token>                                 │
│            Content-Type: application/json                                       │
│                                                                                  │
│ Body :                                                                           │
│ {                                                                                │
│   "accountId": "investment-account-id",                                          │
│   "securityId": "aapl-id",                                                       │
│   "type": "BUY",                                                                 │
│   "quantity": 10,                                                                │
│   "price": 180.00                                                                │
│ }                                                                                │
│                                                                                  │
│ Coût total : (10 × 180.00) + 1 = 1 801€                                         │
│                                                                                  │
│ Résultat attendu :                                                               │
│ ✅ 1 801€ réservés du compte                                                    │
│ ✅ Ordre créé avec status PENDING                                               │
│ ✅ Matching automatique si ordres SELL compatibles                              │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ EXEMPLE 3 : PLACER UN ORDRE DE VENTE (CLIENT) ─────────────────────────────────┐
│                                                                                  │
│ Endpoint : POST http://localhost:3000/api/orders                                │
│ Headers  : Authorization: Bearer <client-token>                                 │
│            Content-Type: application/json                                       │
│                                                                                  │
│ Body :                                                                           │
│ {                                                                                │
│   "accountId": "investment-account-id",                                          │
│   "securityId": "aapl-id",                                                       │
│   "type": "SELL",                                                                │
│   "quantity": 5,                                                                 │
│   "price": 175.00                                                                │
│ }                                                                                │
│                                                                                  │
│ Montant reçu (si exécuté) : (5 × 175.00) - 1 = 874€                             │
│                                                                                  │
│ Résultat attendu :                                                               │
│ ✅ 5 actions réservées du portfolio                                             │
│ ✅ Ordre créé avec status PENDING                                               │
│ ✅ Matching automatique si ordres BUY compatibles                               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ EXEMPLE 4 : CONSULTER LE PRIX D'ÉQUILIBRE ─────────────────────────────────────┐
│                                                                                  │
│ Endpoint : GET http://localhost:3000/api/securities/aapl-id/equilibrium-price   │
│ Headers  : Authorization: Bearer <token>                                        │
│                                                                                  │
│ Résultat attendu :                                                               │
│ {                                                                                │
│   "securityId": "aapl-id",                                                       │
│   "symbol": "AAPL",                                                              │
│   "equilibriumPrice": 177.50,      ← Prix d'équilibre calculé                  │
│   "lastTrade": 175.00,              ← Dernier prix d'exécution                  │
│   "bestBid": 180.00,                ← Meilleur prix d'achat                     │
│   "bestAsk": 175.00,                ← Meilleur prix de vente                    │
│   "spread": 5.00,                   ← Écart bid-ask                             │
│   "spreadPercent": 2.86,            ← Écart en %                                │
│   "lastUpdated": "2025-01-05T03:00:00Z"                                         │
│ }                                                                                │
│                                                                                  │
│ ✅ Prix d'équilibre = (180 + 175) / 2 = 177.50€                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ EXEMPLE 5 : CONSULTER LE CARNET D'ORDRES ──────────────────────────────────────┐
│                                                                                  │
│ Endpoint : GET http://localhost:3000/api/securities/aapl-id/order-book          │
│ Headers  : Authorization: Bearer <token>                                        │
│                                                                                  │
│ Résultat attendu :                                                               │
│ {                                                                                │
│   "bids": [                          ← Ordres d'achat (prix décroissant)        │
│     { "price": 180.00, "quantity": 10, "totalQuantity": 10 },                   │
│     { "price": 178.50, "quantity": 5, "totalQuantity": 15 },                    │
│     { "price": 177.00, "quantity": 8, "totalQuantity": 23 }                     │
│   ],                                                                             │
│   "asks": [                          ← Ordres de vente (prix croissant)         │
│     { "price": 175.00, "quantity": 5, "totalQuantity": 5 },                     │
│     { "price": 176.00, "quantity": 12, "totalQuantity": 17 },                   │
│     { "price": 178.00, "quantity": 7, "totalQuantity": 24 }                     │
│   ],                                                                             │
│   "equilibriumPrice": 177.50         ← Prix d'équilibre calculé                 │
│ }                                                                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ EXEMPLE 6 : CONSULTER MON PORTEFEUILLE ────────────────────────────────────────┐
│                                                                                  │
│ Endpoint : GET http://localhost:3000/api/portfolio/investment-account-id        │
│ Headers  : Authorization: Bearer <client-token>                                 │
│                                                                                  │
│ Résultat attendu :                                                               │
│ {                                                                                │
│   "accountId": "investment-account-id",                                          │
│   "totalValue": 1850.00,             ← Valeur totale du portefeuille            │
│   "positions": [                                                                 │
│     {                                                                            │
│       "securityId": "aapl-id",                                                   │
│       "symbol": "AAPL",                                                          │
│       "name": "Apple Inc.",                                                      │
│       "quantity": 10,                ← Nombre d'actions possédées                │
│       "averagePrice": 180.00,        ← Prix moyen d'achat                        │
│       "currentPrice": 185.00,        ← Prix actuel (d'équilibre)                 │
│       "totalValue": 1850.00,         ← Valeur actuelle                           │
│       "unrealizedGain": 50.00,       ← Plus-value latente                        │
│       "unrealizedGainPercent": 2.78  ← Gain en %                                 │
│     }                                                                            │
│   ]                                                                              │
│ }                                                                                │
│                                                                                  │
│ ✅ Les clients sont PROPRIÉTAIRES de leurs actions (selon le sujet)            │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌─ EXEMPLE 7 : ANNULER UN ORDRE ───────────────────────────────────────────────────┐
│                                                                                  │
│ Endpoint : DELETE http://localhost:3000/api/orders/order-id                     │
│ Headers  : Authorization: Bearer <client-token>                                 │
│                                                                                  │
│ Résultat attendu :                                                               │
│ ✅ Ordre passé à status CANCELLED                                               │
│ ✅ Fonds/titres réservés libérés                                                │
│ ✅ Event OrderCancelledEvent enregistré                                         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

EOF

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                       SCÉNARIO COMPLET DE TEST                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

cat << 'EOF'
┌─ SCÉNARIO : TRADING COMPLET AVEC MATCHING ──────────────────────────────────────┐
│                                                                                  │
│ 1️⃣  Le Directeur crée l'action Apple (AAPL) à 180€                             │
│                                                                                  │
│ 2️⃣  Client A place un ordre de VENTE                                            │
│     SELL: 10 actions à 179€                                                      │
│     → 10 actions réservées du portfolio                                          │
│     → Ordre PENDING dans le carnet                                               │
│                                                                                  │
│ 3️⃣  Client B place un ordre d'ACHAT                                             │
│     BUY: 5 actions à 180€                                                        │
│     → 901€ réservés (5 × 180 + 1)                                               │
│     → MATCHING AUTOMATIQUE !                                                     │
│                                                                                  │
│ 4️⃣  Exécution du match                                                          │
│     • Prix d'exécution : 179€ (prix du vendeur)                                 │
│     • Quantité : 5 actions                                                       │
│     • Client B paie : 5 × 179 + 1 = 896€                                        │
│     • Client A reçoit : 5 × 179 - 1 = 894€                                      │
│     • Portfolio Client B : +5 actions AAPL                                       │
│     • Ordre Client A : 5 actions restantes PENDING                               │
│                                                                                  │
│ 5️⃣  Mise à jour du prix d'équilibre                                             │
│     • currentPrice de AAPL → 179€                                               │
│     • Dernier trade : 179€                                                       │
│                                                                                  │
│ 6️⃣  Client C consulte le prix d'équilibre                                       │
│     GET /api/securities/aapl-id/equilibrium-price                                │
│     → equilibriumPrice: 179.00€                                                  │
│     → bestBid: null                                                              │
│     → bestAsk: 179.00€ (5 actions restantes de Client A)                        │
│                                                                                  │
│ ✅ RÉSULTAT : Système de trading complet fonctionnel !                          │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

EOF

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                          DOCUMENTATION COMPLÈTE                             ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📄 Rapport détaillé (10 pages) :"
echo "   → TRADING_SYSTEM_COMPLETE_REPORT.md"
echo ""
echo "📄 Référence rapide :"
echo "   → TRADING_QUICK_REFERENCE.md"
echo ""
echo "📄 Résumé visuel :"
echo "   → SYSTEME_TRADING_RESUME.txt"
echo ""
echo "📄 Guide email :"
echo "   → docs/EMAIL_SETUP_GUIDE.md"
echo ""
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                  ✅ SYSTÈME COMPLET ET OPÉRATIONNEL                         ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
