const express = require('express');
const router = express.Router();
const { createMarket, getMarkets, getMarketById, resolveMarket } = require('../controllers/marketController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', getMarkets);
router.get('/:id', getMarketById);
router.post('/', auth, adminOnly, createMarket);
router.post('/:id/resolve', auth, adminOnly, resolveMarket);

module.exports = router;
