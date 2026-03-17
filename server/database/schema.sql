-- Prediction Market Platform Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0.00 CHECK (balance >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'resolved', 'cancelled')),
  resolution VARCHAR(5) CHECK (resolution IN ('YES', 'NO', NULL)),
  yes_price DECIMAL(5,2) DEFAULT 5.00,
  no_price DECIMAL(5,2) DEFAULT 5.00,
  total_volume DECIMAL(12,2) DEFAULT 0.00,
  end_date TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  side VARCHAR(5) NOT NULL CHECK (side IN ('YES', 'NO')),
  type VARCHAR(5) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  price DECIMAL(5,2) NOT NULL CHECK (price >= 0.5 AND price <= 9.5),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  filled_quantity INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'filled', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES markets(id),
  buy_order_id INTEGER REFERENCES orders(id),
  sell_order_id INTEGER REFERENCES orders(id),
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  side VARCHAR(5) NOT NULL CHECK (side IN ('YES', 'NO')),
  price DECIMAL(5,2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallet Transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'order_placed', 'order_cancelled', 'trade_win', 'trade_loss', 'refund')),
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Price History table
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  yes_price DECIMAL(5,2) NOT NULL,
  no_price DECIMAL(5,2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_market ON orders(market_id, status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_trades_market ON trades(market_id);
CREATE INDEX idx_trades_buyer ON trades(buyer_id);
CREATE INDEX idx_trades_seller ON trades(seller_id);
CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX idx_price_history_market ON price_history(market_id, recorded_at);
CREATE INDEX idx_markets_status ON markets(status);

-- Seed admin user (password: admin123)
-- Hash generated from bcryptjs with 10 rounds
INSERT INTO users (username, email, password_hash, display_name, role)
VALUES ('admin', 'admin@probo.com', '$2a$10$XQCg1z4YR1S8Q9K5q5E5aeJfG1K9YjV5q5E5aeJfG1K9YjV5q5E5a', 'Admin', 'admin')
ON CONFLICT (username) DO NOTHING;
