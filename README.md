# 🎯 Probo - Prediction Market Platform

A full-stack prediction market web app where users trade YES/NO shares on real-world events. Built with Next.js, Express, PostgreSQL, and Socket.io.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** v14+
- **npm**

### 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE probo;"

# Run schema
psql -U postgres -d probo -f server/database/schema.sql
```

### 2. Start Backend

```bash
cd server
npm install
# Edit .env with your database credentials
node src/app.js
```

Server runs on **http://localhost:5000**

### 3. Start Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**

### 4. Create Admin User

Register a new user, then promote to admin via SQL:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

---

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

This starts PostgreSQL, backend, and frontend. Access at **http://localhost:3000**.

---

## 📁 Project Structure

```
├── client/              # Next.js frontend
│   ├── src/
│   │   ├── app/         # Pages (dashboard, market, wallet, admin...)
│   │   ├── components/  # Navbar, MarketCard, TradePanel
│   │   ├── hooks/       # useSocket
│   │   └── lib/         # api.ts, auth.tsx
│
├── server/              # Express backend
│   ├── src/
│   │   ├── controllers/ # Auth, Market, Order, Wallet, Admin
│   │   ├── routes/      # API routes
│   │   ├── services/    # matchingEngine.js
│   │   ├── middleware/  # auth, rateLimiter, errorHandler
│   │   └── websocket/   # Socket.io handler
│   ├── database/
│   │   └── schema.sql
│
├── docker-compose.yml
└── README.md
```

---

## 🔧 Features

| Feature | Description |
|---------|-------------|
| **Auth** | JWT signup/login with bcrypt |
| **Markets** | Browse, search, filter by category |
| **Trading** | YES/NO shares, ₹0.5–₹9.5 price range |
| **Matching Engine** | Price-time priority order matching |
| **Wallet** | Deposit, withdraw, transaction history |
| **Real-time** | Socket.io live price & trade updates |
| **Admin Panel** | Create/resolve markets, manage users |
| **Leaderboard** | Top traders ranked by winnings |

---

## 🌐 Deployment (AWS / DigitalOcean)

### Using PM2 + Nginx

```bash
# Backend
cd server && npm install
pm2 start src/app.js --name probo-api

# Frontend
cd client && npm install && npm run build
pm2 start npm --name probo-web -- start
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api {
        proxy_pass http://localhost:5000;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 🔒 Security

- JWT authentication with expiry
- bcrypt password hashing (10 rounds)
- API rate limiting (100 req/15min)
- Input validation on all endpoints
- CORS restricted to client origin
- Wallet balance checks before trades
