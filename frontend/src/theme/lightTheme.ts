import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#10b981', light: '#34d399', dark: '#059669' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    success: { main: '#10b981' },
  },
  typography: {
    fontFamily: '"Tajawal", "Inter", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 3px rgba(0,0,0,0.08)',
    '0 4px 6px rgba(0,0,0,0.07)',
    '0 4px 8px rgba(0,0,0,0.06)',
    '0 6px 12px rgba(0,0,0,0.06)',
    '0 8px 16px rgba(0,0,0,0.05)',
    '0 10px 20px rgba(0,0,0,0.05)',
    '0 12px 24px rgba(0,0,0,0.05)',
    '0 14px 28px rgba(0,0,0,0.06)',
    '0 16px 32px rgba(0,0,0,0.06)',
    '0 18px 36px rgba(0,0,0,0.06)',
    '0 20px 40px rgba(0,0,0,0.07)',
    '0 22px 44px rgba(0,0,0,0.07)',
    '0 24px 48px rgba(0,0,0,0.07)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
    '0 25px 50px rgba(0,0,0,0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          padding: '8px 20px',
          transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.15)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '14px 16px' },
        head: { fontWeight: 600, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important',
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          transition: 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1) !important',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
        },
        list: {
          padding: 6,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 0',
          padding: '8px 12px',
          transition: 'background-color 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
  },
});
