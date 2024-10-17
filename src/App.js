import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, TextField, Button, CircularProgress } from '@material-ui/core';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [vesselName, setVesselName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [ciiResults, setCiiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ports, setPorts] = useState(['', '']);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [portList, setPortList] = useState([]);

  useEffect(() => {
    // Load port list
    fetch('/UpdatedPub150.csv')
      .then(response => response.text())
      .then(data => {
        const ports = data.split('\n').slice(1).map(line => {
          const [name, lat, lon] = line.split(',');
          return { name, lat: parseFloat(lat), lon: parseFloat(lon) };
        });
        setPortList(ports);
      });
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/.netlify/functions/getVesselData', {
        params: { vesselName, year }
      });
      setCiiResults(response.data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePortChange = (index, value) => {
    const newPorts = [...ports];
    newPorts[index] = value;
    setPorts(newPorts);
  };

  const calculateRoute = () => {
    const startPort = portList.find(p => p.name === ports[0]);
    const endPort = portList.find(p => p.name === ports[1]);
    if (startPort && endPort) {
      setRoute([
        [startPort.lat, startPort.lon],
        [endPort.lat, endPort.lon]
      ]);
      // Simple distance calculation (this is not accurate for long distances)
      const dist = L.latLng(startPort.lat, startPort.lon).distanceTo(L.latLng(endPort.lat, endPort.lon)) / 1852; // Convert meters to nautical miles
      setDistance(Math.round(dist));
    }
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
            <pre>{JSON.stringify(ciiResults, null, 2)}</pre>
          </Box>
        )}
        <Box my={2}>
          <Typography variant="h6">Route Calculation</Typography>
          {ports.map((port, index) => (
            <TextField
              key={index}
              fullWidth
              label={`Port ${index + 1}`}
              value={port}
              onChange={(e) => handlePortChange(index, e.target.value)}
              margin="normal"
            />
          ))}
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={calculateRoute}
            disabled={!ports[0] || !ports[1]}
          >
            Calculate Route
          </Button>
        </Box>
        {distance > 0 && (
          <Typography>Distance: {distance} nautical miles</Typography>
        )}
        {route.length > 0 && (
          <Box my={2} style={{ height: '400px' }}>
            <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline positions={route} color="red" />
              {route.map((position, index) => (
                <Marker key={index} position={position} />
              ))}
            </MapContainer>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
