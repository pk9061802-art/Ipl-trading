const db = require('../config/db');
const firebase = require('../config/firebase');

/**
 * Simplified Prediction Market Matching Engine
 *
 * Price range: ₹0.50 - ₹9.50
 * YES + NO always sum to ₹10
 *
 * Order matching rules:
 * - BUY YES at price P matches with SELL YES at price <= P
 * - BUY NO at price P matches with SELL NO at price <= P
 * - BUY YES at price P also matches with BUY NO at price (10 - P)
 *   (buying YES at 7 is equivalent to a counterparty buying NO at 3)
 *
 * Price-time priority: best price first, then oldest order first.
 */

class MatchingEngine {
  constructor() {
    // In-memory cache (primary source of truth is still the DB)
  }

  async matchOrder(newOrder, io) {
    const trades = [];

    // Find matching orders from the opposite side
    let matchQuery;
    const params = [newOrder.market_id, newOrder.id];

    if (newOrder.type === 'BUY') {
      // A BUY YES order can be matched with:
      // 1. SELL YES orders with price <= buy price
      // 2. BUY NO orders with price >= (10 - buy price)
      if (newOrder.side === 'YES') {
        matchQuery = `
          (SELECT * FROM orders
           WHERE market_id = $1 AND id != $2
             AND status IN ('open', 'partial')
             AND ((side = 'YES' AND type = 'SELL' AND price <= $3)
               OR (side = 'NO' AND type = 'BUY' AND price >= $4))
           ORDER BY price ASC, created_at ASC)
        `;
        params.push(newOrder.price, 10 - parseFloat(newOrder.price));
      } else {
        // BUY NO
        matchQuery = `
          (SELECT * FROM orders
           WHERE market_id = $1 AND id != $2
             AND status IN ('open', 'partial')
             AND ((side = 'NO' AND type = 'SELL' AND price <= $3)
               OR (side = 'YES' AND type = 'BUY' AND price >= $4))
           ORDER BY price ASC, created_at ASC)
        `;
        params.push(newOrder.price, 10 - parseFloat(newOrder.price));
      }
    } else {
      // SELL orders match with BUY orders
      if (newOrder.side === 'YES') {
        matchQuery = `
          SELECT * FROM orders
          WHERE market_id = $1 AND id != $2
            AND status IN ('open', 'partial')
            AND side = 'YES' AND type = 'BUY' AND price >= $3
          ORDER BY price DESC, created_at ASC
        `;
        params.push(newOrder.price);
      } else {
        matchQuery = `
          SELECT * FROM orders
          WHERE market_id = $1 AND id != $2
            AND status IN ('open', 'partial')
            AND side = 'NO' AND type = 'BUY' AND price >= $3
          ORDER BY price DESC, created_at ASC
        `;
        params.push(newOrder.price);
      }
    }

    const matchingOrders = await db.query(matchQuery, params);

    let remainingQty = newOrder.quantity - newOrder.filled_quantity;

    for (const matchOrder of matchingOrders.rows) {
      if (remainingQty <= 0) break;

      // Don't match with own orders
      if (matchOrder.user_id === newOrder.user_id) continue;

      const matchAvailable = matchOrder.quantity - matchOrder.filled_quantity;
      const fillQty = Math.min(remainingQty, matchAvailable);

      // Determine trade price (price of the resting order)
      const tradePrice = parseFloat(matchOrder.price);

      // Determine buyer and seller
      let buyerId, sellerId, buyOrderId, sellOrderId;

      if (newOrder.type === 'BUY') {
        buyerId = newOrder.user_id;
        sellerId = matchOrder.user_id;
        buyOrderId = newOrder.id;
        sellOrderId = matchOrder.id;
      } else {
        buyerId = matchOrder.user_id;
        sellerId = newOrder.user_id;
        buyOrderId = matchOrder.id;
        sellOrderId = newOrder.id;
      }

      // Create trade record
      const tradeResult = await db.query(
        `INSERT INTO trades (market_id, buy_order_id, sell_order_id, buyer_id, seller_id, side, price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [newOrder.market_id, buyOrderId, sellOrderId, buyerId, sellerId, newOrder.side, tradePrice, fillQty]
      );

      trades.push(tradeResult.rows[0]);

      // Save to Firebase (Fire and forget)
      this.saveTradeToFirebase(tradeResult.rows[0]).catch(err => {
        console.error('Firebase save failed:', err.message);
      });

      // Update filled quantities
      const newFilledQty = newOrder.filled_quantity + fillQty;
      const matchFilledQty = matchOrder.filled_quantity + fillQty;

      const newStatus = newFilledQty >= newOrder.quantity ? 'filled' : 'partial';
      const matchStatus = matchFilledQty >= matchOrder.quantity ? 'filled' : 'partial';

      await db.query(
        'UPDATE orders SET filled_quantity = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [newFilledQty, newStatus, newOrder.id]
      );

      await db.query(
        'UPDATE orders SET filled_quantity = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [matchFilledQty, matchStatus, matchOrder.id]
      );

      // Credit seller's wallet
      const sellerCredit = tradePrice * fillQty;
      await db.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
        [sellerCredit, sellerId]
      );

      // Log transaction for seller
      await db.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
         VALUES ($1, 'trade_sold', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, $4)`,
        [sellerId, sellerCredit, `market-${newOrder.market_id}`, `Sold ${fillQty} shares at ₹${tradePrice}`]
      );

      // Notify buyer and seller about balance change
      if (io) {
        const buyerWallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [buyerId]);
        const sellerWallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [sellerId]);

        io.to(`user-${buyerId}`).emit('balance-update', { balance: parseFloat(buyerWallet.rows[0].balance) });
        io.to(`user-${sellerId}`).emit('balance-update', { balance: parseFloat(sellerWallet.rows[0].balance) });
      }

      // Update market volume and price
      await this.updateMarketPrice(newOrder.market_id, tradePrice, newOrder.side, fillQty);

      remainingQty -= fillQty;
      newOrder.filled_quantity += fillQty;
    }

    // Emit WebSocket events
    if (io && trades.length > 0) {
      const marketData = await db.query('SELECT * FROM markets WHERE id = $1', [newOrder.market_id]);
      if (marketData.rows.length > 0) {
        io.emit('price-update', {
          marketId: newOrder.market_id,
          yesPrice: parseFloat(marketData.rows[0].yes_price),
          noPrice: parseFloat(marketData.rows[0].no_price),
          volume: parseFloat(marketData.rows[0].total_volume),
        });

        io.emit('trade-executed', {
          marketId: newOrder.market_id,
          trades: trades.map(t => ({
            id: t.id,
            side: t.side,
            price: parseFloat(t.price),
            quantity: t.quantity,
            createdAt: t.created_at,
          })),
        });
      }
    }

    return trades;
  }

  async updateMarketPrice(marketId, tradePrice, side, quantity) {
    let yesPrice, noPrice;

    if (side === 'YES') {
      yesPrice = tradePrice;
      noPrice = 10 - tradePrice;
    } else {
      noPrice = tradePrice;
      yesPrice = 10 - tradePrice;
    }

    const volume = tradePrice * quantity;

    await db.query(
      `UPDATE markets
       SET yes_price = $1, no_price = $2, total_volume = total_volume + $3, updated_at = NOW()
       WHERE id = $4`,
      [yesPrice, noPrice, volume, marketId]
    );

    // Record price history
    await db.query(
      'INSERT INTO price_history (market_id, yes_price, no_price) VALUES ($1, $2, $3)',
      [marketId, yesPrice, noPrice]
    );
  }

  async saveTradeToFirebase(trade) {
    try {
      // Check if Firebase is initialized
      if (!firebase.admin.apps.length) {
        return;
      }

      // Create a document in 'trades' collection
      await firebase.db.collection('trades').add({
        market_id: trade.market_id,
        side: trade.side,
        price: parseFloat(trade.price),
        quantity: trade.quantity,
        buyer_id: trade.buyer_id,
        seller_id: trade.seller_id,
        executed_at: new Date(), // Firebase timestamp
        system: 'ipl-probo'
      });
      console.log('✅ Trade saved to Firebase Firestore');
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new MatchingEngine();
