const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database/probo.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  const schemaPath = path.join(__dirname, '../../database/schema_sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing schema', err.message);
      } else {
        console.log('Database schema initialized.');
      }
    });
  }
}

module.exports = {
  query: (text, params = []) => {
    return new Promise((resolve, reject) => {
      // Map PostgreSQL numbered placeholders ($1, $2) to SQLite positional (?)
      // This handles cases where the same placeholder (e.g., $1) is used multiple times.
      const matches = [...text.matchAll(/\$(\d+)/g)];
      const mappedParams = matches.map(m => params[parseInt(m[1]) - 1]);
      let sqliteQuery = text.replace(/\$\d+/g, '?');
      
      sqliteQuery = sqliteQuery.replace(/NOW\(\)/g, "CURRENT_TIMESTAMP");
      
      const isSelect = sqliteQuery.trim().toUpperCase().startsWith('SELECT');
      const isInsert = sqliteQuery.trim().toUpperCase().startsWith('INSERT');
      const hasReturning = sqliteQuery.toUpperCase().includes('RETURNING');

      if (isSelect) {
        db.all(sqliteQuery, mappedParams, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else if (isInsert && hasReturning) {
        // Strip RETURNING for execution
        const execQuery = sqliteQuery.split(/RETURNING/i)[0].trim();
        db.run(execQuery, mappedParams, function(err) {
          if (err) return reject(err);
          
          const lastId = this.lastID;
          // Extract table name to fetch the row
          const tableMatch = sqliteQuery.match(/INSERT INTO\s+([a-zA-Z0-9_]+)/i);
          const tableName = tableMatch ? tableMatch[1] : null;

          if (tableName) {
            db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [lastId], (err, row) => {
              if (err) reject(err);
              else resolve({ rows: [row], rowCount: 1 });
            });
          } else {
            resolve({ rows: [{ id: lastId }], rowCount: 1 });
          }
        });
      } else {
        db.run(sqliteQuery, mappedParams, function(err) {
          if (err) reject(err);
          else {
            resolve({ 
              rows: this.lastID ? [{ id: this.lastID }] : [],
              rowCount: this.changes 
            });
          }
        });
      }
    });
  }
};
