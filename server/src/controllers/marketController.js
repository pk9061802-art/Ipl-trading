const db = require('../config/db');

const createMarket = async (req, res, next) => {
  try {
    const { title, description, category, imageUrl, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Market title is required.' });
    }

    const result = await db.query(
      `INSERT INTO markets (title, description, category, image_url, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, category || 'general', imageUrl, endDate, req.user.id]
    );

    // Record initial price
    const market = result.rows[0];
    await db.query(
      'INSERT INTO price_history (market_id, yes_price, no_price) VALUES ($1, $2, $3)',
      [market.id, 5.00, 5.00]
    );

    res.status(201).json({ message: 'Market created!', market });
  } catch (err) {
    next(err);
  }
};

const getMarkets = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT m.*, u.username as creator_name FROM markets m LEFT JOIN users u ON u.id = m.created_by';
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`m.status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`m.category = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY m.created_at DESC';
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    const countQuery = status
      ? 'SELECT COUNT(*) FROM markets WHERE status = $1'
      : 'SELECT COUNT(*) FROM markets';
    const countResult = await db.query(countQuery, status ? [status] : []);

    res.json({
      markets: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (err) {
    next(err);
  }
};

const getMarketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT m.*, u.username as creator_name FROM markets m
       LEFT JOIN users u ON u.id = m.created_by
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Market not found.' });
    }

    // Get order book
    const ordersResult = await db.query(
      `SELECT side, type, price, SUM(quantity - filled_quantity) as total_quantity
       FROM orders WHERE market_id = $1 AND status IN ('open', 'partial')
       GROUP BY side, type, price ORDER BY price DESC`,
      [id]
    );

    // Get recent trades
    const tradesResult = await db.query(
      `SELECT t.*, b.username as buyer_name, s.username as seller_name
       FROM trades t
       LEFT JOIN users b ON b.id = t.buyer_id
       LEFT JOIN users s ON s.id = t.seller_id
       WHERE t.market_id = $1 ORDER BY t.created_at DESC LIMIT 20`,
      [id]
    );

    // Get price history
    const priceHistory = await db.query(
      'SELECT * FROM price_history WHERE market_id = $1 ORDER BY recorded_at ASC',
      [id]
    );

    res.json({
      market: result.rows[0],
      orderBook: ordersResult.rows,
      recentTrades: tradesResult.rows,
      priceHistory: priceHistory.rows,
    });
  } catch (err) {
    next(err);
  }
};

const resolveMarket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!['YES', 'NO'].includes(resolution)) {
      return res.status(400).json({ error: 'Resolution must be YES or NO.' });
    }

    const market = await db.query('SELECT * FROM markets WHERE id = $1', [id]);
    if (market.rows.length === 0) {
      return res.status(404).json({ error: 'Market not found.' });
    }
    if (market.rows[0].status === 'resolved') {
      return res.status(400).json({ error: 'Market already resolved.' });
    }

    // Cancel all open orders and refund
    const openOrders = await db.query(
      "SELECT * FROM orders WHERE market_id = $1 AND status IN ('open', 'partial')",
      [id]
    );

    for (const order of openOrders.rows) {
      const remaining = order.quantity - order.filled_quantity;
      const refundAmount = remaining * parseFloat(order.price);

      await db.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [order.id]);

      if (order.type === 'BUY') {
        await db.query(
          'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
          [refundAmount, order.user_id]
        );

        await db.query(
          `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
           VALUES ($1, 'refund', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, $4)`,
          [order.user_id, refundAmount, `order-${order.id}`, 'Order cancelled - market resolved']
        );
      }
    }

    // Pay out winners: find all trades where user bought the winning side
    const winningSide = resolution;
    const winningTrades = await db.query(
      `SELECT buyer_id, SUM(quantity) as total_shares, SUM(price * quantity) as total_cost
       FROM trades WHERE market_id = $1 AND side = $2
       GROUP BY buyer_id`,
      [id, winningSide]
    );

    for (const trade of winningTrades.rows) {
      const payout = parseFloat(trade.total_shares) * 10; // Winners get ₹10 per share
      await db.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
        [payout, trade.buyer_id]
      );

      await db.query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_id, description)
         VALUES ($1, 'trade_win', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, $4)`,
        [trade.buyer_id, payout, `market-${id}`, `Won prediction: ${market.rows[0].title}`]
      );
    }

    // Resolve the market
    await db.query(
      "UPDATE markets SET status = 'resolved', resolution = $1, resolved_at = NOW(), updated_at = NOW() WHERE id = $2",
      [resolution, id]
    );

    // Broadcast resolution
    if (req.io) {
      req.io.emit('market-resolved', { marketId: parseInt(id), resolution });
      req.io.emit('leaderboard-update');
    }

    res.json({ message: `Market resolved as ${resolution}.` });
  } catch (err) {
    next(err);
  }
};

module.exports = { createMarket, getMarkets, getMarketById, resolveMarket };
