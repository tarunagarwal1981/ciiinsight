import React from 'react';
import { ThemeProvider, createMuiTheme, CssBaseline } from '@material-ui/core';
import CIICalculator from './CIICalculator';

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#4CAF50',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CIICalculator />
    </ThemeProvider>
  );
}

export default App;
