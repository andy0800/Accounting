import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Secretaries from './pages/Secretaries';
import SecretaryDetail from './pages/SecretaryDetail';
import Visas from './pages/Visas';
import VisaDetail from './pages/VisaDetail';
import NewVisa from './pages/NewVisa';
import Accounts from './pages/Accounts';
import CompanyAccount from './pages/CompanyAccount';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Create Arabic theme
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        dir: 'rtl',
      },
    },
    MuiInputLabel: {
      defaultProps: {
        dir: 'rtl',
      },
    },
    MuiSelect: {
      defaultProps: {
        dir: 'rtl',
      },
    },
    MuiMenuItem: {
      defaultProps: {
        dir: 'rtl',
      },
    },
  },
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 