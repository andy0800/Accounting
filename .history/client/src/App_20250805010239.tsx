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
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0', // أزرق داكن احترافي
      contrastText: '#fff',
    },
    secondary: {
      main: '#455a64', // رمادي أزرق
    },
    background: {
      default: '#f4f6fa', // أبيض رمادي فاتح
      paper: '#fff',
    },
    text: {
      primary: '#222',
      secondary: '#607d8b',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', letterSpacing: '-1px' },
    h2: { fontWeight: 700, fontSize: '2rem', letterSpacing: '-1px' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 700, fontSize: '1.25rem' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    body1: { fontSize: '1.05rem' },
    body2: { fontSize: '0.95rem' },
    button: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f4f6fa',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
          boxShadow: '0 2px 8px rgba(21,101,192,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(21,101,192,0.07)',
          borderRadius: 16,
          border: '1px solid #e0e0e0',
          padding: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(21,101,192,0.04)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          textTransform: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          padding: '12px 8px',
        },
        head: {
          fontWeight: 700,
          background: '#e3eaf6',
          color: '#1565c0',
          fontSize: '1.05rem',
        },
        body: {
          color: '#263238',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          background: '#fff',
          borderRadius: 12,
          fontSize: '1rem',
        },
        columnHeaders: {
          background: '#e3eaf6',
          color: '#1565c0',
          fontWeight: 700,
        },
        cell: {
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        inputProps: {
          style: { textAlign: 'right' },
        },
      },
      styleOverrides: {
        root: {
          background: '#fff',
          borderRadius: 8,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
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
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 2,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
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