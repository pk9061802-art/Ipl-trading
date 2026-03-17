const express = require('express');
const router = express.Router();
const { getBalance, deposit, withdraw, getTransactions } = require('../controllers/walletController');
const { auth } = require('../middleware/auth');

router.get('/balance', auth, getBalance);
router.post('/deposit', auth, deposit);
router.post('/withdraw', auth, withdraw);
router.get('/transactions', auth, getTransactions);

module.exports = router;
