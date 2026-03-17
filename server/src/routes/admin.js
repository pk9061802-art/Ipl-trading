const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  toggleSuspendUser, 
  getAnalytics, 
  getPendingTransactions, 
  approveTransaction 
} = require('../controllers/adminController');
const { createMarket, resolveMarket } = require('../controllers/marketController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

router.get('/users', getUsers);
router.post('/users/:id/toggle-suspend', toggleSuspendUser);
router.get('/analytics', getAnalytics);
router.post('/markets', createMarket);
router.post('/markets/:id/resolve', resolveMarket);
router.get('/transactions', getPendingTransactions);
router.post('/transactions/:id/approve', approveTransaction);

module.exports = router;
