require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./websocket/socketHandler');

// Routes
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/markets');
const orderRoutes = require('./routes/orders');
const walletRoutes = require('./routes/wallet');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Allowed origins - supports multiple URLs via comma-separated CLIENT_URL
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim());

const allowedOrigins = [
  ...clientUrls,
  'http://localhost:3000',
  'http://localhost:3001',
];

// Dynamic origin check for Vercel preview deployments
const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true); // Allow non-browser requests
  if (allowedOrigins.includes(origin)) return callback(null, true);
  // Allow any vercel.app subdomain for preview deployments
  if (origin.endsWith('.vercel.app')) return callback(null, true);
  callback(new Error('Not allowed by CORS'));
};

// Socket.io
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST'],
  },
});

setupSocket(io);

// Middleware
app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}));
app.use(express.json());
app.use(apiLimiter);

// Attach io to requests so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 India IPL Bet Server running on ${HOST}:${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

module.exports = { app, server, io };