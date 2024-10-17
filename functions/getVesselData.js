const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    console.log('Connecting to database with connection string:', connectionString);
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

exports.handler = async function(event, context) {
  console.log('Function invoked with event:', JSON.stringify(event));
  const { vesselName, year } = event.queryStringParameters;

  if (!vesselName || !year) {
    console.log('Missing parameters:', { vesselName, year });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
  }

  try {
    console.log('Attempting to connect to database');
    const client = await getPool().connect();
    try {
      console.log('Executing query for:', { vesselName, year });
      const result = await client.query(`
        SELECT 
          t1."VESSEL_NAME" AS "Vessel",
          t1."VESSEL_IMO" AS "IMO",
          SUM("DISTANCE_TRAVELLED_ACTUAL") AS "total_distance",
          COALESCE((SUM("FUEL_CONSUMPTION_HFO") - SUM("FC_FUEL_CONSUMPTION_HFO")) * 3.114, 0) + 
          COALESCE((SUM("FUEL_CONSUMPTION_LFO") - SUM("FC_FUEL_CONSUMPTION_LFO")) * 3.151, 0) + 
          COALESCE((SUM("FUEL_CONSUMPTION_GO_DO") - SUM("FC_FUEL_CONSUMPTION_GO_DO")) * 3.206, 0) + 
          COALESCE((SUM("FUEL_CONSUMPTION_LNG") - SUM("FC_FUEL_CONSUMPTION_LNG")) * 2.75, 0) + 
          COALESCE((SUM("FUEL_CONSUMPTION_LPG") - SUM("FC_FUEL_CONSUMPTION_LPG")) * 3.00, 0) + 
          COALESCE((SUM("FUEL_CONSUMPTION_METHANOL") - SUM("FC_FUEL_CONSUMPTION_METHANOL")) * 1.375, 0) + 
          COALESCE((SUM("FUEL_CONSUMPTION_ETHANOL") - SUM("FC_FUEL_CONSUMPTION_ETHANOL")) * 1.913, 0) AS "CO2Emission",
          t2."deadweight" AS "capacity",
          t2."vessel_type",
          ROUND(CAST(SUM("DISTANCE_TRAVELLED_ACTUAL") * t2."deadweight" AS NUMERIC), 2) AS "Transportwork",
          CASE 
            WHEN ROUND(CAST(SUM("DISTANCE_TRAVELLED_ACTUAL") * t2."deadweight" AS NUMERIC), 2) <> 0 
            THEN ROUND(CAST((
              COALESCE((SUM("FUEL_CONSUMPTION_HFO") - SUM("FC_FUEL_CONSUMPTION_HFO")) * 3.114, 0) + 
              COALESCE((SUM("FUEL_CONSUMPTION_LFO") - SUM("FC_FUEL_CONSUMPTION_LFO")) * 3.151, 0) + 
              COALESCE((SUM("FUEL_CONSUMPTION_GO_DO") - SUM("FC_FUEL_CONSUMPTION_GO_DO")) * 3.206, 0) + 
              COALESCE((SUM("FUEL_CONSUMPTION_LNG") - SUM("FC_FUEL_CONSUMPTION_LNG")) * 2.75, 0) + 
              COALESCE((SUM("FUEL_CONSUMPTION_LPG") - SUM("FC_FUEL_CONSUMPTION_LPG")) * 3.00, 0) + 
              COALESCE((SUM("FUEL_CONSUMPTION_METHANOL") - SUM("FC_FUEL_CONSUMPTION_METHANOL")) * 1.375, 0) + 
              COALESCE((SUM("FUEL_CONSUMPTION_ETHANOL") - SUM("FC_FUEL_CONSUMPTION_ETHANOL")) * 1.913, 0)
            ) * 1000000 / (SUM("DISTANCE_TRAVELLED_ACTUAL") * t2."deadweight") AS NUMERIC), 2)
            ELSE NULL
          END AS "Attained_AER"
        FROM 
          "sf_consumption_logs" AS t1
        LEFT JOIN 
          "vessel_particulars" AS t2 ON t1."VESSEL_IMO" = t2."vessel_imo"
        WHERE 
          t1."VESSEL_NAME" = $1
          AND EXTRACT(YEAR FROM "REPORT_DATE") = $2
        GROUP BY 
          t1."VESSEL_NAME", t1."VESSEL_IMO", t2."deadweight", t2."vessel_type"
      `, [vesselName, year]);
      
      console.log('Query result:', result);

      if (result.rows.length === 0) {
        console.log('No data found for:', { vesselName, year });
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No data found for the given vessel and year' })
        };
      }

      const vesselData = result.rows[0];
      console.log('Vessel data:', vesselData);

      return {
        statusCode: 200,
        body: JSON.stringify(vesselData)
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database query error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to query database', details: err.message })
    };
  }
};
