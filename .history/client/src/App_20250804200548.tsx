import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Secretaries from './pages/Secretaries';
import SecretaryDetail from './pages/SecretaryDetail';
import Visas from './pages/Visas';
import VisaDetail from './pages/VisaDetail';
import NewVisa from './pages/NewVisa';
import Accounts from './pages/Accounts';
import CompanyAccount from './pages/CompanyAccount';

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="xl">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/secretaries" element={<Secretaries />} />
            <Route path="/secretaries/:id" element={<SecretaryDetail />} />
            <Route path="/visas" element={<Visas />} />
            <Route path="/visas/:id" element={<VisaDetail />} />
            <Route path="/visas/new" element={<NewVisa />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/company" element={<CompanyAccount />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
}

export default App; 