const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database', 'probo.sqlite');
const db = new sqlite3.Database(dbPath);

const migration = `
  PRAGMA foreign_keys=OFF;
  BEGIN TRANSACTION;
  
  CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    is_suspended INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  INSERT INTO users_new (id, username, email, password_hash, display_name, avatar_url, role, is_suspended, created_at, updated_at)
  SELECT id, username, email, password_hash, display_name, avatar_url, role, is_suspended, created_at, updated_at FROM users;
  
  DROP TABLE users;
  ALTER TABLE users_new RENAME TO users;
  
  COMMIT;
  PRAGMA foreign_keys=ON;
`;

db.serialize(() => {
  db.exec(migration, (err) => {
    if (err) {
      console.error('Migration failed:', err.message);
    } else {
      console.log('✅ Migration successful: email column is now optional.');
    }
    db.close();
  });
});
