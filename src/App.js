import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import LinearRegression from './components/LinearRegression';
import MultipleRegression from './components/MultipleRegression';
import LogisticRegression from './components/LogisticRegression';
import CoxRegression from './components/CoxRegression';
import PoissonRegression from './components/PoissonRegression';
import Home from './components/Home';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/linear" element={<LinearRegression />} />
          <Route path="/multiple" element={<MultipleRegression />} />
          <Route path="/logistic" element={<LogisticRegression />} />
          <Route path="/cox" element={<CoxRegression />} />
          <Route path="/poisson" element={<PoissonRegression />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App; 