import { createTheme, alpha } from '@mui/material/styles';
import { carbonTheme } from './carbonTheme';
import { carbonColors, carbonFocusRing } from './carbonTokens';
import { glassTokens, ambientBackground } from './glass';

const dark = glassTokens.dark;
const blurMd = 'blur(20px) saturate(180%)';
const blurLg = 'blur(24px) saturate(180%)';
const blurXl = 'blur(36px) saturate(200%)';
const focusRing = carbonFocusRing.dark;
const primaryLight = '#78a9ff';

export const carbonDarkTheme = createTheme({
  ...carbonTheme,
  palette: {
    mode: 'dark',
    primary: { main: primaryLight, dark: '#4589ff', light: '#a6c8ff' },
    secondary: { main: '#08bdba', dark: '#009d9a' },
    background: { default: '#0b0c12', paper: carbonColors.gray90 },
    text: { primary: '#f4f4f4', secondary: '#c6c6c6', disabled: '#8d8d8d' },
    error: { main: '#ff8389' },
    warning: { main: '#ffb784' },
    info: { main: '#82cfff' },
    success: { main: '#6fdc8c' },
    divider: 'rgba(255,255,255,0.09)',
    action: {
      hover: 'rgba(255,255,255,0.06)',
      selected: 'rgba(120,169,255,0.16)',
      disabledBackground: 'rgba(255,255,255,0.08)',
    },
  },
  components: {
    ...carbonTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"IBM Plex Sans Arabic", "Tajawal", "Inter", sans-serif',
          background: ambientBackground('dark'),
          backgroundAttachment: 'fixed',
          color: '#f4f4f4',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.28) transparent',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        ...(carbonTheme.components?.MuiButton as any)?.styleOverrides,
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: 0,
          borderRadius: 10,
          '&.Mui-focusVisible': { boxShadow: focusRing },
        },
        contained: {
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0))',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35), 0 8px 20px -8px rgba(120,169,255,0.45)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.35), 0 12px 26px -8px rgba(120,169,255,0.55)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: alpha(primaryLight, 0.42),
          backgroundColor: 'rgba(255,255,255,0.03)',
          '&:hover': {
            borderColor: primaryLight,
            backgroundColor: alpha(primaryLight, 0.09),
            boxShadow: '0 4px 14px -6px rgba(120,169,255,0.45)',
          },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          color: '#c6c6c6',
          transition:
            'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff' },
          '&.Mui-focusVisible': { boxShadow: focusRing },
        },
        sizeSmall: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: dark.fill,
          backdropFilter: blurLg,
          WebkitBackdropFilter: blurLg,
          border: `1px solid ${dark.hairline}`,
          boxShadow: dark.shadow,
          transition:
            'box-shadow 200ms cubic-bezier(0.2, 0, 0.38, 0.9), transform 200ms cubic-bezier(0.2, 0, 0.38, 0.9), border-color 200ms cubic-bezier(0.2, 0, 0.38, 0.9)',
          '&:hover': { boxShadow: dark.shadowHover, transform: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: dark.fill,
          backdropFilter: blurMd,
          WebkitBackdropFilter: blurMd,
          border: `1px solid ${dark.hairline}`,
        },
        rounded: { borderRadius: 16 },
        elevation0: { boxShadow: 'none' },
        elevation1: { boxShadow: dark.shadow },
        elevation2: { boxShadow: dark.shadow },
        elevation3: { boxShadow: dark.shadowHover },
        elevation4: { boxShadow: dark.shadowHover },
        elevation8: { boxShadow: dark.shadowHover },
        elevation16: { boxShadow: dark.shadowHover },
        elevation24: { boxShadow: dark.shadowHover },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.04)',
            transition:
              'box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.07)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha('#f4f4f4', 0.38),
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255,255,255,0.06)',
              boxShadow: focusRing,
            },
            '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.03)' },
          },
          '& .MuiInputLabel-root': { fontSize: '0.875rem', fontWeight: 500 },
          '& .MuiInputLabel-root.Mui-focused': { fontWeight: 600 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(255,255,255,0.04)',
          transition:
            'box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
          '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.06)', boxShadow: focusRing },
          '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.03)' },
        },
        notchedOutline: { borderColor: 'rgba(255,255,255,0.2)', transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)' },
        input: { padding: '10.5px 14px' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: '#c6c6c6', '&.Mui-focused': { color: primaryLight } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '12px 16px', fontSize: '0.875rem', lineHeight: 1.5, borderBottom: `1px solid ${dark.hairline}` },
        head: {
          fontWeight: 700,
          fontSize: '0.6875rem',
          lineHeight: 1.4,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          backgroundColor: 'rgba(38,38,38,0.92)',
          color: '#c6c6c6',
          borderBottom: '1px solid rgba(255,255,255,0.14)',
        },
        stickyHeader: { backgroundColor: 'rgba(38,38,38,0.96)', backdropFilter: 'blur(16px) saturate(160%)' },
        footer: { borderTop: '1px solid rgba(255,255,255,0.14)', borderBottom: 'none', fontWeight: 600 },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(120,169,255,0.07)' },
          '&.Mui-selected': { backgroundColor: 'rgba(120,169,255,0.13)' },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(120,169,255,0.17)' },
        },
        head: { '&:hover': { backgroundColor: 'transparent' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.01em',
          height: 28,
          '&.Mui-focusVisible': { boxShadow: focusRing },
        },
        label: { paddingInlineStart: 10, paddingInlineEnd: 10 },
        filled: { backgroundColor: alpha(carbonColors.gray80, 0.85), color: '#f4f4f4' },
        outlined: { borderColor: alpha(carbonColors.gray70, 0.85), backgroundColor: 'rgba(255,255,255,0.03)' },
        sizeSmall: { height: 24, borderRadius: 7, fontSize: '0.6875rem' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          borderRight: `1px solid ${dark.hairline}`,
          backgroundColor: dark.fillStrong,
          backdropFilter: blurLg,
          WebkitBackdropFilter: blurLg,
          boxShadow: dark.shadowHover,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.35), 0 12px 32px -16px rgba(0,0,0,0.6)',
          borderBottom: `1px solid ${dark.hairline}`,
          backgroundColor: dark.fillStrong,
          backdropFilter: blurMd,
          WebkitBackdropFilter: blurMd,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 46, borderBottom: `1px solid ${dark.hairline}` },
        indicator: { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: primaryLight },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: 0,
          minHeight: 46,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
          '&.Mui-selected': { fontWeight: 700, color: primaryLight },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backgroundColor: dark.fillStrong,
          backdropFilter: blurXl,
          WebkitBackdropFilter: blurXl,
          boxShadow: dark.shadowHover,
          border: `1px solid ${dark.hairline}`,
        },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        dividers: { borderColor: dark.hairline },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { borderTop: `1px solid ${dark.hairline}` },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          backgroundColor: dark.fillStrong,
          backdropFilter: blurXl,
          WebkitBackdropFilter: blurXl,
          boxShadow: dark.shadowHover,
          border: `1px solid ${dark.hairline}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          marginTop: 6,
          backgroundColor: dark.fillStrong,
          backdropFilter: blurXl,
          WebkitBackdropFilter: blurXl,
          boxShadow: dark.shadowHover,
          border: `1px solid ${dark.hairline}`,
        },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': { backgroundColor: 'rgba(120,169,255,0.14)', fontWeight: 600 },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(120,169,255,0.18)' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: carbonColors.gray80, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.6)' },
        arrow: { color: carbonColors.gray80 },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: dark.shadowHover, fontWeight: 500 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: dark.hairline },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)' },
        bar: { borderRadius: 999 },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, '&.Mui-selected': { boxShadow: '0 4px 12px -6px rgba(120,169,255,0.55)' } },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: `1px solid ${dark.hairline}`, fontSize: '0.8125rem' },
        toolbar: { minHeight: 52 },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: { '&:hover': { color: '#f4f4f4' }, '&.Mui-active': { color: '#f4f4f4' } },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: { backgroundColor: 'transparent', color: '#a8a8a8' },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase': {
            '&.Mui-checked': {
              '& + .MuiSwitch-track': { backgroundColor: primaryLight },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': { boxShadow: focusRing },
          },
          '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.22)' },
        },
      },
    },
  },
});
