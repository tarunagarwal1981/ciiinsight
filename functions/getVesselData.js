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
      
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'No data found for the given vessel and year' })
        };
      }

      const vesselData = result.rows[0];
      
      // Here you would add the CII calculation logic
      // This is a placeholder. Replace with actual CII calculation.
      const ciiRating = calculateCIIRating(vesselData.Attained_AER, vesselData.vessel_type, vesselData.capacity, year);

      return {
        statusCode: 200,
        body: JSON.stringify({...vesselData, ciiRating})
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

// Placeholder function. Replace with actual CII rating calculation.
function calculateCIIRating(attainedAER, vesselType, capacity, year) {
  // This is a dummy calculation. Replace with the actual logic from your Python script.
  const ratings = ['A', 'B', 'C', 'D', 'E'];
  return ratings[Math.floor(Math.random() * ratings.length)];
}
