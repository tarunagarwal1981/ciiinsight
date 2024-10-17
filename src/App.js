import React, { useState } from 'react';
import { Typography, Container, Box, TextField, Button, CircularProgress } from '@material-ui/core';
import axios from 'axios';

function App() {
  const [vesselName, setVesselName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [ciiResults, setCiiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/.netlify/functions/getVesselData', {
        params: { vesselName, year }
      });
      const data = response.data;
      // Perform CII calculation here
      const attainedAER = data.Attained_AER;
      const vesselType = data.vessel_type;
      const capacity = data.capacity;

      // This is a placeholder calculation. Replace with actual CII calculation logic.
      const ciiRating = calculateCIIRating(attainedAER, vesselType, capacity, year);

      setCiiResults({
        attainedAER,
        ciiRating,
        vesselType,
        capacity
      });
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Placeholder function. Replace with actual CII rating calculation.
  const calculateCIIRating = (attainedAER, vesselType, capacity, year) => {
    // This is a dummy calculation. Replace with the actual logic.
    const rating = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
    return rating;
  };

  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          CII Calculator
        </Typography>
        <Box my={2}>
          <TextField
            fullWidth
            label="Vessel Name"
            value={vesselName}
            onChange={(e) => setVesselName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            margin="normal"
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleCalculate}
            disabled={loading || !vesselName}
          >
            Calculate CII
          </Button>
        </Box>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {ciiResults && (
          <Box my={2}>
            <Typography variant="h6">CII Results</Typography>
            <Typography>Attained AER: {ciiResults.attainedAER}</Typography>
            <Typography>CII Rating: {ciiResults.ciiRating}</Typography>
            <Typography>Vessel Type: {ciiResults.vesselType}</Typography>
            <Typography>Capacity: {ciiResults.capacity}</Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
