const db = require('../config/db');

const getLeaderboard = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        u.id, u.username, u.display_name, u.avatar_url,
        COALESCE(w.balance, 0) as balance,
        COUNT(DISTINCT t.id) as total_trades,
        COALESCE(SUM(CASE WHEN wt.type = 'trade_win' THEN wt.amount ELSE 0 END), 0) as total_winnings
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      LEFT JOIN trades t ON t.buyer_id = u.id OR t.seller_id = u.id
      LEFT JOIN wallet_transactions wt ON wt.user_id = u.id
      WHERE u.role = 'user' AND u.is_suspended = FALSE
      GROUP BY u.id, u.username, u.display_name, u.avatar_url, w.balance
      ORDER BY total_winnings DESC, balance DESC
      LIMIT 50
    `);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      balance: parseFloat(row.balance),
      totalTrades: parseInt(row.total_trades),
      totalWinnings: parseFloat(row.total_winnings),
    }));

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
