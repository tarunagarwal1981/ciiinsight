// functions/getVesselData.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

exports.handler = async function(event, context) {
  const { vesselName, year } = event.queryStringParameters;

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT ... FROM ... WHERE "VESSEL_NAME" = $1 AND EXTRACT(YEAR FROM "REPORT_DATE") = $2`,
      [vesselName, year]
    );
    client.release();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to query database' })
    };
  }
};
