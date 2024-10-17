import React from 'react';
import { Typography, Container, Box } from '@material-ui/core';

function App() {
  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          CII Calculator
        </Typography>
        <Typography variant="body1">
          Welcome to the CII Calculator. This page is working correctly if you can see this text.
        </Typography>
      </Box>
    </Container>
  );
}

export default App;
