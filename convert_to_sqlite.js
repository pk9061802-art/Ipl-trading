const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'server', 'database', 'schema.sql');
const sqliteSchemaPath = path.join(__dirname, 'server', 'database', 'schema_sqlite.sql');

if (fs.existsSync(schemaPath)) {
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Convert PostgreSQL to SQLite
    schema = schema.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    schema = schema.replace(/TIMESTAMP DEFAULT NOW\(\)/g, "DATETIME DEFAULT CURRENT_TIMESTAMP");
    schema = schema.replace(/DECIMAL\(\d+,\d+\)/g, 'REAL');
    schema = schema.replace(/BOOLEAN DEFAULT (FALSE|TRUE)/g, (match, p1) => `INTEGER DEFAULT ${p1 === 'TRUE' ? 1 : 0}`);
    schema = schema.replace(/CHECK \((.*?)\)/g, ''); // Simplification
    schema = schema.replace(/CREATE INDEX idx_.*?;/g, ''); // Simplification
    schema = schema.replace(/ON CONFLICT \(username\) DO NOTHING/g, '');

    fs.writeFileSync(sqliteSchemaPath, schema);
    console.log('SQLite schema generated at ' + sqliteSchemaPath);
} else {
    console.error('Schema not found at ' + schemaPath);
}
