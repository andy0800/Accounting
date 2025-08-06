import '@mui/material/styles';
import '@mui/x-data-grid';

declare module '@mui/material/styles' {
  interface Components {
    MuiDataGrid?: {
      styleOverrides?: {
        root?: React.CSSProperties;
        columnHeaders?: React.CSSProperties;
        cell?: React.CSSProperties;
      };
    };
  }
} 