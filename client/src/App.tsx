import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, ThemeProvider, createTheme, CssBaseline, CircularProgress } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { backendPreloader } from './utils/backendPreloader';
import { cacheManager } from './utils/cacheManager';
import { auth } from './utils/auth';

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
const NewRentingSecretary = React.lazy(() => import('./pages/NewRentingSecretary'));
const RentalUnits = React.lazy(() => import('./pages/RentalUnits'));
const NewRentalUnit = React.lazy(() => import('./pages/NewRentalUnit'));
const RentalContracts = React.lazy(() => import('./pages/RentalContracts'));
const NewRentalContract = React.lazy(() => import('./pages/NewRentalContract'));
const RentalDetail = React.lazy(() => import('./pages/RentalDetail'));
const RentalManagement = React.lazy(() => import('./pages/RentalManagement'));
const RentalAccounting = React.lazy(() => import('./pages/RentalAccounting'));
const Login = React.lazy(() => import('./pages/Login'));
const Users = React.lazy(() => import('./pages/Users'));
// Home Service pages
const HSDashboard = React.lazy(() => import('./pages/home-service/HSDashboard'));
const HSInvoices = React.lazy(() => import('./pages/home-service/HSInvoices'));
const HSNewInvoice = React.lazy(() => import('./pages/home-service/HSNewInvoice'));
const HSInvoiceDetails = React.lazy(() => import('./pages/home-service/HSInvoiceDetails'));
const HSDeletedInvoices = React.lazy(() => import('./pages/home-service/HSDeletedInvoices'));
const HSAccounting = React.lazy(() => import('./pages/home-service/HSAccounting'));
// Fursatkum Accounting System (admin only)
const FursatkumDashboard = React.lazy(() => import('./pages/fursatkum/FursatkumDashboard'));
const FursatkumInvoices = React.lazy(() => import('./pages/fursatkum/FursatkumInvoices'));
const FursatkumNewInvoice = React.lazy(() => import('./pages/fursatkum/FursatkumNewInvoice'));
const FursatkumInvoiceDetails = React.lazy(() => import('./pages/fursatkum/FursatkumInvoiceDetails'));
const FursatkumDeletedInvoices = React.lazy(() => import('./pages/fursatkum/FursatkumDeletedInvoices'));
const FursatkumAccounting = React.lazy(() => import('./pages/fursatkum/FursatkumAccounting'));
const FursatkumEmployees = React.lazy(() => import('./pages/fursatkum/EmployeesList'));
const FursatkumEmployeeDetails = React.lazy(() => import('./pages/fursatkum/EmployeeDetails'));
const FursatkumNewEmployee = React.lazy(() => import('./pages/fursatkum/NewEmployee'));
const FursatkumNewLoan = React.lazy(() => import('./pages/fursatkum/NewLoan'));
const FursatkumSalaryProcessor = React.lazy(() => import('./pages/fursatkum/SalaryProcessor'));
// Farwaniya office systems
const FW1Dashboard = React.lazy(() => import('./pages/farwaniya/FW1Dashboard'));
const FW1Invoices = React.lazy(() => import('./pages/farwaniya/FW1Invoices'));
const FW1NewInvoice = React.lazy(() => import('./pages/farwaniya/FW1NewInvoice'));
const FW1InvoiceDetails = React.lazy(() => import('./pages/farwaniya/FW1InvoiceDetails'));
const FW1DeletedInvoices = React.lazy(() => import('./pages/farwaniya/FW1DeletedInvoices'));
const FW1Accounting = React.lazy(() => import('./pages/farwaniya/FW1Accounting'));
const FW2Dashboard = React.lazy(() => import('./pages/farwaniya/FW2Dashboard'));
const FW2Invoices = React.lazy(() => import('./pages/farwaniya/FW2Invoices'));
const FW2NewInvoice = React.lazy(() => import('./pages/farwaniya/FW2NewInvoice'));
const FW2InvoiceDetails = React.lazy(() => import('./pages/farwaniya/FW2InvoiceDetails'));
const FW2DeletedInvoices = React.lazy(() => import('./pages/farwaniya/FW2DeletedInvoices'));
const FW2Accounting = React.lazy(() => import('./pages/farwaniya/FW2Accounting'));


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

  // Force login on full refresh (component mount)
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    // Clear any existing session and redirect to login
    auth.logout();
    navigate('/login', { replace: true });
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLogged = auth.isLoggedIn();
  const role = auth.getRole();

  const protect = (element: React.ReactElement, path: string) => {
    if (!isLogged) return <Navigate to="/login" state={{ from: location }} replace />;
    if (role === 'admin') return element;
    if (role === 'secretary') {
      // allow trial contract routes and their details
      if (path.startsWith('/trial-contracts')) return element;
      return <Navigate to="/trial-contracts" replace />;
    }
    if (role === 'home_service_user') {
      // allow only home service routes
      if (path.startsWith('/home-service')) return element;
      return <Navigate to="/home-service" replace />;
    }
    if (role === 'farwaniya1_user') {
      if (path.startsWith('/farwaniya1')) return element;
      return <Navigate to="/farwaniya1" replace />;
    }
    if (role === 'farwaniya2_user') {
      if (path.startsWith('/farwaniya2')) return element;
      return <Navigate to="/farwaniya2" replace />;
    }
    return <Navigate to="/login" replace />;
  };

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
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={protect(<Dashboard />, '/')} />
                    <Route path="/secretaries" element={protect(<Secretaries />, '/secretaries')} />
                    <Route path="/secretaries/:id" element={protect(<SecretaryDetail />, '/secretaries/:id')} />
                    <Route path="/visas" element={protect(<Visas />, '/visas')} />
                    <Route path="/visas/:id" element={protect(<VisaDetail />, '/visas/:id')} />
                    <Route path="/visas/new" element={protect(<NewVisa />, '/visas/new')} />
                    <Route path="/accounts" element={protect(<Accounts />, '/accounts')} />
                    {/* Trial Contracts (Visa Handover) */}
                    <Route path="/trial-contracts" element={protect(<TrialContracts />, '/trial-contracts')} />
                    <Route path="/trial-contracts/new" element={protect(<NewTrialContract />, '/trial-contracts/new')} />
                    <Route path="/trial-contracts/:id" element={protect(<TrialContractDetail />, '/trial-contracts/:id')} />

                    {/* Renting system */}
                    <Route path="/renting" element={protect(<RentingDashboard />, '/renting')} />
                    <Route path="/renting/secretaries" element={protect(<RentingSecretaries />, '/renting/secretaries')} />
                    <Route path="/renting/secretaries/new" element={protect(<NewRentingSecretary />, '/renting/secretaries/new')} />
                    <Route path="/renting/units" element={protect(<RentalUnits />, '/renting/units')} />
                    <Route path="/renting/units/new" element={protect(<NewRentalUnit />, '/renting/units/new')} />
                    <Route path="/renting/contracts" element={protect(<RentalContracts />, '/renting/contracts')} />
                    <Route path="/renting/contracts/new" element={protect(<NewRentalContract />, '/renting/contracts/new')} />
                    <Route path="/renting/contracts/:id" element={protect(<RentalDetail />, '/renting/contracts/:id')} />
                    <Route path="/renting/management" element={protect(<RentalManagement />, '/renting/management')} />
                    <Route path="/renting/accounting" element={protect(<RentalAccounting />, '/renting/accounting')} />

                    {/* Users (admin only) */}
                    <Route path="/users" element={protect(<Users />, '/users')} />

                    {/* Home Service system */}
                    <Route path="/home-service" element={protect(<HSDashboard />, '/home-service')} />
                    <Route path="/home-service/invoices" element={protect(<HSInvoices />, '/home-service/invoices')} />
                    <Route path="/home-service/invoices/new" element={protect(<HSNewInvoice />, '/home-service/invoices/new')} />
                    <Route path="/home-service/invoices/:id" element={protect(<HSInvoiceDetails />, '/home-service/invoices/:id')} />
                    <Route path="/home-service/deleted" element={protect(<HSDeletedInvoices />, '/home-service/deleted')} />
                    <Route path="/home-service/accounting" element={protect(<HSAccounting />, '/home-service/accounting')} />
                    
                    {/* Fursatkum Accounting System (admin only) */}
                    <Route path="/fursatkum" element={protect(<FursatkumDashboard />, '/fursatkum')} />
                    <Route path="/fursatkum/invoices" element={protect(<FursatkumInvoices />, '/fursatkum/invoices')} />
                    <Route path="/fursatkum/invoices/new" element={protect(<FursatkumNewInvoice />, '/fursatkum/invoices/new')} />
                    <Route path="/fursatkum/invoices/:id" element={protect(<FursatkumInvoiceDetails />, '/fursatkum/invoices/:id')} />
                    <Route path="/fursatkum/deleted" element={protect(<FursatkumDeletedInvoices />, '/fursatkum/deleted')} />
                    <Route path="/fursatkum/accounting" element={protect(<FursatkumAccounting />, '/fursatkum/accounting')} />
                    <Route path="/fursatkum/employees" element={protect(<FursatkumEmployees />, '/fursatkum/employees')} />
                    <Route path="/fursatkum/employees/new" element={protect(<FursatkumNewEmployee />, '/fursatkum/employees/new')} />
                    <Route path="/fursatkum/employees/:id" element={protect(<FursatkumEmployeeDetails />, '/fursatkum/employees/:id')} />
                    <Route path="/fursatkum/loans/new" element={protect(<FursatkumNewLoan />, '/fursatkum/loans/new')} />
                    <Route path="/fursatkum/salaries/process" element={protect(<FursatkumSalaryProcessor />, '/fursatkum/salaries/process')} />
                    {/* Renting system (shifted under Fursatkum) */}
                    <Route path="/fursatkum/renting" element={protect(<RentingDashboard />, '/fursatkum/renting')} />
                    <Route path="/fursatkum/renting/secretaries" element={protect(<RentingSecretaries />, '/fursatkum/renting/secretaries')} />
                    <Route path="/fursatkum/renting/secretaries/new" element={protect(<NewRentingSecretary />, '/fursatkum/renting/secretaries/new')} />
                    <Route path="/fursatkum/renting/units" element={protect(<RentalUnits />, '/fursatkum/renting/units')} />
                    <Route path="/fursatkum/renting/units/new" element={protect(<NewRentalUnit />, '/fursatkum/renting/units/new')} />
                    <Route path="/fursatkum/renting/contracts" element={protect(<RentalContracts />, '/fursatkum/renting/contracts')} />
                    <Route path="/fursatkum/renting/contracts/new" element={protect(<NewRentalContract />, '/fursatkum/renting/contracts/new')} />
                    <Route path="/fursatkum/renting/contracts/:id" element={protect(<RentalDetail />, '/fursatkum/renting/contracts/:id')} />
                    <Route path="/fursatkum/renting/management" element={protect(<RentalManagement />, '/fursatkum/renting/management')} />
                    <Route path="/fursatkum/renting/accounting" element={protect(<RentalAccounting />, '/fursatkum/renting/accounting')} />

                    {/* Farwaniya office systems */}
                    <Route path="/farwaniya1" element={protect(<FW1Dashboard />, '/farwaniya1')} />
                    <Route path="/farwaniya1/invoices" element={protect(<FW1Invoices />, '/farwaniya1/invoices')} />
                    <Route path="/farwaniya1/invoices/new" element={protect(<FW1NewInvoice />, '/farwaniya1/invoices/new')} />
                    <Route path="/farwaniya1/invoices/:id" element={protect(<FW1InvoiceDetails />, '/farwaniya1/invoices/:id')} />
                    <Route path="/farwaniya1/deleted" element={protect(<FW1DeletedInvoices />, '/farwaniya1/deleted')} />
                    <Route path="/farwaniya1/accounting" element={protect(<FW1Accounting />, '/farwaniya1/accounting')} />

                    <Route path="/farwaniya2" element={protect(<FW2Dashboard />, '/farwaniya2')} />
                    <Route path="/farwaniya2/invoices" element={protect(<FW2Invoices />, '/farwaniya2/invoices')} />
                    <Route path="/farwaniya2/invoices/new" element={protect(<FW2NewInvoice />, '/farwaniya2/invoices/new')} />
                    <Route path="/farwaniya2/invoices/:id" element={protect(<FW2InvoiceDetails />, '/farwaniya2/invoices/:id')} />
                    <Route path="/farwaniya2/deleted" element={protect(<FW2DeletedInvoices />, '/farwaniya2/deleted')} />
                    <Route path="/farwaniya2/accounting" element={protect(<FW2Accounting />, '/farwaniya2/accounting')} />
                    
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
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App; 