-- SQLite Schema for Prediction Market Platform

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  is_suspended INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance REAL DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  resolution VARCHAR(5),
  yes_price REAL DEFAULT 5.00,
  no_price REAL DEFAULT 5.00,
  total_volume REAL DEFAULT 0.00,
  end_date DATETIME,
  created_by INTEGER REFERENCES users(id),
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  side VARCHAR(5) NOT NULL,
  type VARCHAR(5) NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  filled_quantity INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id INTEGER REFERENCES markets(id),
  buy_order_id INTEGER REFERENCES orders(id),
  sell_order_id INTEGER REFERENCES orders(id),
  buyer_id INTEGER REFERENCES users(id),
  seller_id INTEGER REFERENCES users(id),
  side VARCHAR(5) NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  reference_id TEXT,
  description TEXT,
  status VARCHAR(20) DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  yes_price REAL NOT NULL,
  no_price REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed admin user (password: admin123)
INSERT OR IGNORE INTO users (username, email, password_hash, display_name, role)
VALUES ('admin', 'admin@probo.com', '$2a$10$XQCg1z4YR1S8Q9K5q5E5aeJfG1K9YjV5q5E5aeJfG1K9YjV5q5E5a', 'Admin', 'admin');
