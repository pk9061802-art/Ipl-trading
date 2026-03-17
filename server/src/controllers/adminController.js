const db = require('../config/db');

// Admin: Get all users
const getUsers = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.display_name, u.role, u.is_suspended, u.created_at,
             COALESCE(w.balance, 0) as balance
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
};

// Admin: Suspend/unsuspend user
const toggleSuspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE users SET is_suspended = NOT is_suspended, updated_at = NOW() WHERE id = $1 RETURNING id, username, is_suspended',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = result.rows[0];
    res.json({
      message: user.is_suspended ? 'User suspended.' : 'User unsuspended.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get analytics
const getAnalytics = async (req, res, next) => {
  try {
    const [usersCount, marketsCount, tradesCount, volumeResult] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM markets'),
      db.query('SELECT COUNT(*) FROM trades'),
      db.query('SELECT COALESCE(SUM(total_volume), 0) as total_volume FROM markets'),
    ]);

    const recentTrades = await db.query(
      `SELECT t.*, m.title as market_title, b.username as buyer_name, s.username as seller_name
       FROM trades t
       LEFT JOIN markets m ON m.id = t.market_id
       LEFT JOIN users b ON b.id = t.buyer_id
       LEFT JOIN users s ON s.id = t.seller_id
       ORDER BY t.created_at DESC LIMIT 10`
    );

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalMarkets: parseInt(marketsCount.rows[0].count),
      totalTrades: parseInt(tradesCount.rows[0].count),
      totalVolume: parseFloat(volumeResult.rows[0].total_volume),
      recentTrades: recentTrades.rows,
    });
  } catch (err) {
    next(err);
  }
};

// Admin: Get all wallet transactions (including pending ones)
const getPendingTransactions = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT t.*, u.username, u.email
      FROM wallet_transactions t
      JOIN users u ON u.id = t.user_id
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
    `);
    res.json({ transactions: result.rows });
  } catch (err) {
    next(err);
  }
};

// Admin: Approve or Reject a transaction
const approveTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const txRes = await db.query('SELECT * FROM wallet_transactions WHERE id = $1', [id]);
    if (txRes.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const tx = txRes.rows[0];
    if (tx.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction is already processed.' });
    }

    if (action === 'approve') {
      if (tx.type === 'deposit') {
        // Update wallet balance for deposit
        await db.query(
          'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
          [Math.abs(tx.amount), tx.user_id]
        );
      }
      // Withdrawal was already deducted from balance when requested (to "lock" it)
      // So if approving a withdrawal, we just mark it as approved.

      const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [tx.user_id]);
      await db.query(
        "UPDATE wallet_transactions SET status = 'approved', balance_after = $1 WHERE id = $2",
        [wallet.rows[0].balance, id]
      );

      res.json({ message: 'Transaction approved.' });
    } else {
      // Reject
      if (tx.type === 'withdrawal') {
        // REFUND the locked balance if rejecting withdrawal
        await db.query(
          'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2',
          [Math.abs(tx.amount), tx.user_id]
        );
      }
      
      const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [tx.user_id]);
      await db.query(
        "UPDATE wallet_transactions SET status = 'rejected', balance_after = $1 WHERE id = $2",
        [wallet.rows[0].balance, id]
      );
      res.json({ message: 'Transaction rejected.' });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, toggleSuspendUser, getAnalytics, getPendingTransactions, approveTransaction };
