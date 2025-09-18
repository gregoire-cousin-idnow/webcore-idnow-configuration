import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Moonlight 2 theme colors
 */
const moonlightColors = {
  background: {
    default: '#1e2030',
    paper: '#222436',
    darker: '#191a2a',
    lighter: '#2f334d',
  },
  primary: {
    main: '#82aaff',
    light: '#adcbff',
    dark: '#5878b9',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#c3a6ff',
    light: '#d4bfff',
    dark: '#9d82cc',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ff757f',
    light: '#ff9ba3',
    dark: '#c74e57',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ffc777',
    light: '#ffd59e',
    dark: '#c99c5e',
    contrastText: '#000000',
  },
  info: {
    main: '#65bcff',
    light: '#97d3ff',
    dark: '#4a8ec7',
    contrastText: '#000000',
  },
  success: {
    main: '#c3e88d',
    light: '#d6f0b0',
    dark: '#9bb46c',
    contrastText: '#000000',
  },
  text: {
    primary: '#c8d3f5',
    secondary: '#a9b8e8',
    disabled: '#7a88cf',
  },
  divider: 'rgba(200, 211, 245, 0.12)',
};

/**
 * Moonlight 2 theme options
 */
export const moonlightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    ...moonlightColors,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: moonlightColors.background.darker,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: moonlightColors.background.darker,
          borderRight: `1px solid ${moonlightColors.divider}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: moonlightColors.background.paper,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${moonlightColors.divider}`,
        },
        head: {
          fontWeight: 600,
          backgroundColor: moonlightColors.background.darker,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: `${moonlightColors.background.lighter} !important`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: moonlightColors.background.paper,
          backgroundImage: 'none',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            color: moonlightColors.text.disabled,
            opacity: 0.7,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: moonlightColors.divider,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: moonlightColors.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: moonlightColors.primary.main,
          },
        },
      },
    },
  },
};

/**
 * Create the Moonlight 2 theme
 */
export const moonlightTheme = createTheme(moonlightThemeOptions);

/**
 * Default theme
 */
export default moonlightTheme;
