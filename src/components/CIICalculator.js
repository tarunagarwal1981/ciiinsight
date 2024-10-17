import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, Paper } from '@material-ui/core';
import RouteMap from './RouteMap';
import CIIProjection from './CIIProjection';
import { calculateCII } from '../utils/ciiCalculations';
import { getVesselData } from '../utils/api';

function CIICalculator() {
  const [vesselName, setVesselName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [ciiResults, setCIIResults] = useState(null);
  const [ports, setPorts] = useState(['', '']);

  const handleCalculate = async () => {
    const vesselData = await getVesselData(vesselName, year);
    const results = calculateCII(vesselData);
    setCIIResults(results);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4">CII Calculator</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper style={{ padding: 16 }}>
          <TextField
            fullWidth
            label="Vessel Name"
            value={vesselName}
            onChange={(e) => setVesselName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          />
          <Button variant="contained" color="primary" onClick={handleCalculate}>
            Calculate CII
          </Button>
          {ciiResults && (
            <div>
              <Typography variant="h6">CII Results</Typography>
              <Typography>Attained AER: {ciiResults.attainedAER}</Typography>
              <Typography>Required CII: {ciiResults.requiredCII}</Typography>
              <Typography>CII Rating: {ciiResults.ciiRating}</Typography>
            </div>
          )}
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <RouteMap ports={ports} />
      </Grid>
      <Grid item xs={12}>
        <CIIProjection ciiResults={ciiResults} />
      </Grid>
    </Grid>
  );
}

export default CIICalculator;
