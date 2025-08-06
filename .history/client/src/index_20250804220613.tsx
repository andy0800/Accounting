import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { createCache, StyleProvider } from '@ant-design/cssinjs';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

// إعداد الخط العربي
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// إعداد RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
} as any);

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
        // numeric: {
        //   textAlign: 'right',
        // },
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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <StyleProvider cache={cacheRtl}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </StyleProvider>
  </React.StrictMode>
); 