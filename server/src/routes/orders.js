const express = require('express');
const router = express.Router();
const { placeOrder, getUserOrders, cancelOrder } = require('../controllers/orderController');
const { auth } = require('../middleware/auth');

router.post('/', auth, placeOrder);
router.get('/', auth, getUserOrders);
router.post('/:id/cancel', auth, cancelOrder);

module.exports = router;
