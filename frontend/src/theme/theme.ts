import { createTheme } from '@mui/material/styles';

// สีหลักของโรงพยาบาล
const hospitalColors = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  background: {
    light: '#f5f5f5',
    dark: '#121212',
  },
  text: {
    light: '#333333',
    dark: '#ffffff',
  }
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: hospitalColors.primary,
    },
    secondary: {
      main: hospitalColors.secondary,
    },
    background: {
      default: hospitalColors.background.light,
      paper: '#ffffff',
    },
    text: {
      primary: hospitalColors.text.light,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", "Noto Sans Thai", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: hospitalColors.primary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: hospitalColors.primary,
    },
    secondary: {
      main: hospitalColors.secondary,
    },
    background: {
      default: hospitalColors.background.dark,
      paper: '#1e1e1e',
    },
    text: {
      primary: hospitalColors.text.dark,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", "Noto Sans Thai", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: hospitalColors.primary,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});
