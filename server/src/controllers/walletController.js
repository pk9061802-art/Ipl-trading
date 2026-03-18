const db = require('../config/db');

const getBalance = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found.' });
    }

    res.json({ balance: parseFloat(result.rows[0].balance) });
  } catch (err) {
    next(err);
  }
};

const deposit = async (req, res, next) => {
  try {
    const { amount, transactionId } = req.body;

    if (!amount || amount <= 0 || amount > 100000) {
      return res.status(400).json({ error: 'Amount must be between ₹1 and ₹100,000.' });
    }

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID (UTR) is required for verification.' });
    }

    // 1. UPDATE WALLET BALANCE IMMEDIATELY (Instant Deposit)
    await db.query(
      'UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [amount, req.user.id]
    );

    // 2. GET UPDATED BALANCE
    const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);
    const newBalance = parseFloat(wallet.rows[0].balance);

    // 3. LOG AS COMPLETED TRANSACTION
    await db.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, reference_id, description, status)
       VALUES ($1, 'deposit', $2, $3, $4, $5, 'completed')`,
      [req.user.id, amount, newBalance, transactionId, `Instant UPI Deposit: ${transactionId}`]
    );

    // 4. EMIT REAL-TIME BALANCE UPDATE
    if (req.io) {
      req.io.to(`user-${req.user.id}`).emit('balance-update', { balance: newBalance });
    }

    res.json({
      message: `Deposit successful! ₹${amount} added to your wallet instantly.`,
      balance: newBalance,
      status: 'completed'
    });
  } catch (err) {
    next(err);
  }
};

const withdraw = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdraw amount.' });
    }

    const wallet = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [req.user.id]);

    if (wallet.rows.length === 0 || parseFloat(wallet.rows[0].balance) < amount) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }

    // Create a PENDING withdrawal request
    await db.query(
      `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, status)
       VALUES ($1, 'withdrawal', $2, (SELECT balance FROM wallets WHERE user_id = $1), $3, 'pending')`,
      [req.user.id, -amount, `Withdrawal request to bank/UPI account`]
    );

    // Temporarily "lock" the amount by deducting it (if you want to prevent double-withdrawing)
    await db.query(
      'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2',
      [amount, req.user.id]
    );

    res.json({
      message: 'Withdrawal request submitted! It will be processed to your account within 24 hours.',
      status: 'pending'
    });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      'SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    res.json({ transactions: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBalance, deposit, withdraw, getTransactions };
