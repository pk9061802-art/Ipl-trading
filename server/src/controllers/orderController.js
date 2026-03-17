const db = require('../config/db');
const matchingEngine = require('../services/matchingEngine');

const placeOrder = async (req, res, next) => {
  try {
    const { marketId, side, type, price, quantity } = req.body;
    const userId = req.user.id;

    // Validation
    if (!marketId || !side || !type || !price || !quantity) {
      return res.status(400).json({ error: 'All fields are required: marketId, side, type, price, quantity.' });
    }
    if (!['YES', 'NO'].includes(side)) {
      return res.status(400).json({ error: 'Side must be YES or NO.' });
    }
    if (!['BUY', 'SELL'].includes(type)) {
      return res.status(400).json({ error: 'Type must be BUY or SELL.' });
    }
    if (price < 0.5 || price > 9.5) {
      return res.status(400).json({ error: 'Price must be between 0.5 and 9.5.' });
    }
    if (quantity < 1 || quantity > 1000) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 1000.' });
    }

    // Check market is active
    const market = await db.query('SELECT * FROM markets WHERE id = $1', [marketId]);
    if (market.rows.length === 0) {
      return res.status(404).json({ error: 'Market not found.' });
    }
    if (market.rows[0].status !== 'active') {
      return res.status(400).json({ error: 'Market is not active.' });
    }

    // For BUY orders, check and deduct wallet balance
    if (type === 'BUY') {
      const totalCost = price * quantity;
      const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);

      if (wallet.rows.length === 0 || parseFloat(wallet.rows[0].balance) < totalCost) {
        return res.status(400).json({ error: `Insufficient balance. Need ₹${totalCost.toFixed(2)}.` });
      }

      await db.query(
        'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
        [totalCost, userId]
      );

      await db.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
         VALUES ($1, 'order_placed', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, $4)`,
        [userId, -totalCost, `market-${marketId}`, `BUY ${quantity} ${side} @ ₹${price}`]
      );

      // Notify balance update
      if (req.io) {
        req.io.to(`user-${userId}`).emit('balance-update', { balance: parseFloat(wallet.rows[0].balance) - totalCost });
      }
    }

    // Create the order
    const result = await db.query(
      `INSERT INTO orders (user_id, market_id, side, type, price, quantity)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, marketId, side, type, price, quantity]
    );

    const order = result.rows[0];

    // Try to match the order
    const trades = await matchingEngine.matchOrder(order, req.io);

    res.status(201).json({
      message: 'Order placed successfully!',
      order,
      trades,
    });
  } catch (err) {
    next(err);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { marketId, status } = req.query;

    let query = `SELECT o.*, m.title as market_title
                 FROM orders o
                 LEFT JOIN markets m ON m.id = o.market_id
                 WHERE o.user_id = $1`;
    const params = [userId];

    if (marketId) {
      params.push(marketId);
      query += ` AND o.market_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await db.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status IN ('open', 'partial')",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or cannot be cancelled.' });
    }

    const order = result.rows[0];
    const remaining = order.quantity - order.filled_quantity;
    const refundAmount = remaining * parseFloat(order.price);

    await db.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [id]);

    if (order.type === 'BUY') {
      await db.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
        [refundAmount, userId]
      );

      await db.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
         VALUES ($1, 'order_cancelled', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, $4)`,
        [userId, refundAmount, `order-${id}`, 'Order cancelled - refund']
      );

      // Notify balance update
      if (req.io) {
        const newWallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        req.io.to(`user-${userId}`).emit('balance-update', { balance: parseFloat(newWallet.rows[0].balance) });
      }
    }

    res.json({ message: 'Order cancelled.', refunded: order.type === 'BUY' ? refundAmount : 0 });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getUserOrders, cancelOrder };
