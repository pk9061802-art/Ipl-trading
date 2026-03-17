const db = require('./server/src/config/db');

async function test() {
  try {
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      ['testuser', 'test@test.com', 'hash']
    );
    console.log('Success!', result.rows);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

test();
