const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

exports.handler = async function(event, context) {
  const { vesselName, year } = event.queryStringParameters;

  if (!vesselName || !year) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
  }

  try {
    const client = await getPool().connect();
    try {
      const result = await client.query(
        `SELECT ... FROM ... WHERE "VESSEL_NAME" = $1 AND EXTRACT(YEAR FROM "REPORT_DATE") = $2`,
        [vesselName, year]
      );
      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0] || {})
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database query error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to query database' })
    };
  }
};
