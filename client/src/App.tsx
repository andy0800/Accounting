import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, ThemeProvider, createTheme, CssBaseline, CircularProgress } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import PerformanceMonitor from './components/PerformanceMonitor';
import { backendPreloader } from './utils/backendPreloader';
import { cacheManager } from './utils/cacheManager';

// Lazy load all components for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Secretaries = React.lazy(() => import('./pages/Secretaries'));
const SecretaryDetail = React.lazy(() => import('./pages/SecretaryDetail'));
const Visas = React.lazy(() => import('./pages/Visas'));
const VisaDetail = React.lazy(() => import('./pages/VisaDetail'));
const NewVisa = React.lazy(() => import('./pages/NewVisa'));
const Accounts = React.lazy(() => import('./pages/Accounts'));
// Trial Contracts
const TrialContracts = React.lazy(() => import('./pages/TrialContracts'));
const NewTrialContract = React.lazy(() => import('./pages/NewTrialContract'));
const TrialContractDetail = React.lazy(() => import('./pages/TrialContractDetail'));
const RentingDashboard = React.lazy(() => import('./pages/RentingDashboard'));
const RentingSecretaries = React.lazy(() => import('./pages/RentingSecretaries'));
const RentalUnits = React.lazy(() => import('./pages/RentalUnits'));
const RentalContracts = React.lazy(() => import('./pages/RentalContracts'));
const NewRentalUnit = React.lazy(() => import('./pages/NewRentalUnit'));
const NewRentalContract = React.lazy(() => import('./pages/NewRentalContract'));
const NewRentingSecretary = React.lazy(() => import('./pages/NewRentingSecretary'));
const TerminatedRentals = React.lazy(() => import('./pages/TerminatedRentals'));
const RentalDetail = React.lazy(() => import('./pages/RentalDetail'));
const RentalPayments = React.lazy(() => import('./pages/RentalPayments'));
const RentingReports = React.lazy(() => import('./pages/RentingReports'));


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
          // Fix for -moz-osx-font-smoothing warning
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
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

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '200px' 
    }}
  >
    <CircularProgress />
  </Box>
);


function App() {
  // Warm up backend when app starts and initialize cache management
  React.useEffect(() => {
    backendPreloader.warmUpBackend();
    
    // Initialize cache management
    console.log('🧹 Cache Manager initialized');
    
    // Schedule automatic cache clearing every 24 hours
    cacheManager.scheduleAutoClear(24);
    
    // Clear expired caches on app start
    cacheManager.clearSpecificCache('api').catch(error => {
      console.warn('⚠️ Could not clear expired API cache:', error);
    });
  }, []);

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Container maxWidth="xl">
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/secretaries" element={<Secretaries />} />
                    <Route path="/secretaries/:id" element={<SecretaryDetail />} />
                    <Route path="/visas" element={<Visas />} />
                    <Route path="/visas/:id" element={<VisaDetail />} />
                    <Route path="/visas/new" element={<NewVisa />} />
                    <Route path="/accounts" element={<Accounts />} />
                    {/* Trial Contracts (Visa Handover) */}
                    <Route path="/trial-contracts" element={<TrialContracts />} />
                    <Route path="/trial-contracts/new" element={<NewTrialContract />} />
                    <Route path="/trial-contracts/:id" element={<TrialContractDetail />} />
                    
                    {/* Renting System Routes */}
                    <Route path="/renting" element={<RentingDashboard />} />
                    <Route path="/renting/secretaries" element={<RentingSecretaries />} />
                    <Route path="/renting/secretaries/new" element={<NewRentingSecretary />} />
                    <Route path="/renting/units" element={<RentalUnits />} />
                    <Route path="/renting/units/new" element={<NewRentalUnit />} />
                    <Route path="/renting/contracts" element={<RentalContracts />} />
                    <Route path="/renting/contracts/new" element={<NewRentalContract />} />
                    <Route path="/renting/contracts/:id" element={<RentalDetail />} />
                    <Route path="/renting/payments/:id" element={<RentalPayments />} />
                    <Route path="/renting/terminated" element={<TerminatedRentals />} />
                    <Route path="/renting/reports" element={<RentingReports />} />
                    
                    {/* Fallback route for 404 errors */}
                    <Route path="*" element={
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <h2>الصفحة غير موجودة</h2>
                        <p>الصفحة التي تبحث عنها غير موجودة</p>
                        <button onClick={() => window.location.href = '/'}>
                          العودة إلى الصفحة الرئيسية
                        </button>
                      </Box>
                    } />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </Container>
          </Box>
        </Box>
        <PerformanceMonitor />
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 