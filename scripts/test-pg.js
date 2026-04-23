const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Mehmetcan2145@db.zawrrcgzimaxtslaurwr.supabase.co:6543/postgres?pgbouncer=true',
});

async function test() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('Connected!');
    
    const result = await client.query('SELECT id, email, name, role FROM users ORDER BY "createdAt" DESC LIMIT 20');
    console.log(`Found ${result.rows.length} users:`);
    result.rows.forEach((u, i) => {
      console.log(`${i+1}. ${u.email} (${u.role})`);
    });
    
    client.release();
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
  }
}

test();