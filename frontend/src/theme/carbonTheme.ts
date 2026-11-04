import { createTheme, alpha } from '@mui/material/styles';
import { carbonColors, carbonFocusRing } from './carbonTokens';
import { glassTokens, ambientBackground } from './glass';

const light = glassTokens.light;
const blurMd = 'blur(20px) saturate(180%)';
const blurLg = 'blur(24px) saturate(180%)';
const blurXl = 'blur(36px) saturate(200%)';
const focusRing = carbonFocusRing.light;

export const carbonTheme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: carbonColors.blue60, dark: carbonColors.blue70, light: carbonColors.blue50 },
    secondary: { main: carbonColors.teal50, dark: carbonColors.teal60 },
    background: { default: '#eef1f8', paper: '#ffffff' },
    text: { primary: carbonColors.gray100, secondary: carbonColors.gray70, disabled: carbonColors.gray50 },
    error: { main: carbonColors.red60 },
    warning: { main: carbonColors.orange40 },
    info: { main: carbonColors.cyan50 },
    success: { main: carbonColors.green50 },
    divider: 'rgba(16,24,40,0.09)',
    action: {
      hover: 'rgba(16,24,40,0.05)',
      selected: 'rgba(15,98,254,0.1)',
      disabledBackground: 'rgba(16,24,40,0.08)',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans Arabic", "Tajawal", "Inter", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.15, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.022em' },
    h3: { fontWeight: 650, fontSize: '1.5rem', lineHeight: 1.25, letterSpacing: '-0.018em' },
    h4: { fontWeight: 650, fontSize: '1.25rem', lineHeight: 1.3, letterSpacing: '-0.014em' },
    h5: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.43, letterSpacing: '-0.005em' },
    subtitle1: { fontSize: '1rem', lineHeight: 1.5, fontWeight: 600, letterSpacing: '-0.008em' },
    subtitle2: { fontSize: '0.875rem', lineHeight: 1.45, fontWeight: 600, letterSpacing: '-0.005em' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.57 },
    button: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.35, letterSpacing: '0', textTransform: 'none' },
    caption: { fontSize: '0.75rem', lineHeight: 1.45, letterSpacing: '0.01em' },
    overline: { fontSize: '0.6875rem', lineHeight: 1.4, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' },
  },
  shape: { borderRadius: 10 },
  spacing: (factor: number) => `${8 * factor}px`,
  breakpoints: {
    values: { xs: 0, sm: 672, md: 1056, lg: 1312, xl: 1584 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"IBM Plex Sans Arabic", "Tajawal", "Inter", sans-serif',
          background: ambientBackground('light'),
          backgroundAttachment: 'fixed',
          color: carbonColors.gray100,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(120,130,150,0.45) transparent',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: 0,
          padding: '8px 16px',
          minHeight: 40,
          borderRadius: 10,
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition:
            'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:active': { transform: 'scale(0.98)' },
          '&.Mui-focusVisible': { boxShadow: focusRing },
          '&.Mui-disabled': { boxShadow: 'none' },
        },
        contained: {
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0))',
          boxShadow: '0 1px 2px rgba(16,24,40,0.12), 0 6px 16px -6px rgba(15,98,254,0.45)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(16,24,40,0.12), 0 10px 24px -8px rgba(15,98,254,0.5)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          color: '#ffffff',
          '&:hover': { backgroundColor: carbonColors.blue70 },
        },
        outlined: {
          borderColor: alpha(carbonColors.blue60, 0.38),
          backgroundColor: 'rgba(255,255,255,0.35)',
          '&:hover': {
            borderColor: carbonColors.blue60,
            backgroundColor: alpha(carbonColors.blue60, 0.06),
            boxShadow: '0 4px 14px -6px rgba(15,98,254,0.35)',
          },
        },
        text: {
          '&:hover': { backgroundColor: 'rgba(16,24,40,0.05)' },
        },
        sizeSmall: { padding: '5px 12px', minHeight: 32, borderRadius: 8, fontSize: '0.8125rem' },
        sizeLarge: { padding: '11px 22px', minHeight: 48, borderRadius: 12, fontSize: '0.9375rem' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          color: carbonColors.gray70,
          transition:
            'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(16,24,40,0.06)', color: carbonColors.gray100 },
          '&.Mui-focusVisible': { boxShadow: focusRing },
        },
        sizeSmall: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: light.fill,
          backdropFilter: blurLg,
          WebkitBackdropFilter: blurLg,
          border: `1px solid ${light.hairline}`,
          boxShadow: light.shadow,
          transition:
            'box-shadow 200ms cubic-bezier(0.2, 0, 0.38, 0.9), transform 200ms cubic-bezier(0.2, 0, 0.38, 0.9), border-color 200ms cubic-bezier(0.2, 0, 0.38, 0.9)',
          '&:hover': {
            boxShadow: light.shadowHover,
            transform: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: light.fill,
          backdropFilter: blurMd,
          WebkitBackdropFilter: blurMd,
          border: `1px solid ${light.hairline}`,
        },
        rounded: { borderRadius: 16 },
        elevation0: { boxShadow: 'none' },
        elevation1: { boxShadow: light.shadow },
        elevation2: { boxShadow: light.shadow },
        elevation3: { boxShadow: light.shadowHover },
        elevation4: { boxShadow: light.shadowHover },
        elevation8: { boxShadow: light.shadowHover },
        elevation16: { boxShadow: light.shadowHover },
        elevation24: { boxShadow: light.shadowHover },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.55)',
            transition:
              'box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.9)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(carbonColors.gray100, 0.38),
              },
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              boxShadow: focusRing,
            },
            '&.Mui-disabled': { backgroundColor: 'rgba(16,24,40,0.04)' },
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
          backgroundColor: 'rgba(255,255,255,0.55)',
          transition:
            'box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), background-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' },
          '&.Mui-focused': { backgroundColor: '#ffffff', boxShadow: focusRing },
          '&.Mui-disabled': { backgroundColor: 'rgba(16,24,40,0.04)' },
        },
        notchedOutline: { borderColor: alpha(carbonColors.gray100, 0.18), transition: 'border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)' },
        input: { padding: '10.5px 14px' },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          transition: 'box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: carbonColors.gray70, '&.Mui-focused': { color: carbonColors.blue60 } },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginInlineStart: 2, fontSize: '0.75rem', lineHeight: 1.45 },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          borderBottom: `1px solid ${light.hairline}`,
        },
        head: {
          fontWeight: 700,
          fontSize: '0.6875rem',
          lineHeight: 1.4,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: carbonColors.gray70,
          backgroundColor: 'rgba(248,250,252,0.92)',
          borderBottom: `1px solid rgba(16,24,40,0.12)`,
        },
        stickyHeader: { backgroundColor: 'rgba(248,250,252,0.96)', backdropFilter: 'blur(16px) saturate(180%)' },
        footer: { borderTop: `1px solid rgba(16,24,40,0.12)`, borderBottom: 'none', fontWeight: 600 },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(15,98,254,0.045)' },
          '&.Mui-selected': { backgroundColor: 'rgba(15,98,254,0.08)' },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(15,98,254,0.11)' },
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
          transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&.Mui-focusVisible': { boxShadow: focusRing },
        },
        label: { paddingInlineStart: 10, paddingInlineEnd: 10 },
        filled: { backgroundColor: alpha(carbonColors.gray20, 0.75), color: carbonColors.gray100 },
        outlined: { borderColor: alpha(carbonColors.gray30, 0.9), backgroundColor: 'rgba(255,255,255,0.4)' },
        sizeSmall: { height: 24, borderRadius: 7, fontSize: '0.6875rem' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          borderRight: `1px solid ${light.hairline}`,
          backgroundColor: light.fillStrong,
          backdropFilter: blurLg,
          WebkitBackdropFilter: blurLg,
          boxShadow: light.shadowHover,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 1px 2px rgba(16,24,40,0.05), 0 8px 24px -16px rgba(16,24,40,0.18)',
          borderBottom: `1px solid ${light.hairline}`,
          backgroundColor: light.fillStrong,
          backdropFilter: blurMd,
          WebkitBackdropFilter: blurMd,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: 48, '&.MuiToolbar-regular': { minHeight: 48 } },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 46, borderBottom: `1px solid ${light.hairline}` },
        indicator: { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: carbonColors.blue60 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: 0,
          fontSize: '0.875rem',
          minHeight: 46,
          padding: '10px 16px',
          transition: 'color 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { backgroundColor: 'rgba(16,24,40,0.04)' },
          '&.Mui-selected': { fontWeight: 700, color: carbonColors.blue60 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          backgroundColor: light.fillStrong,
          backdropFilter: blurXl,
          WebkitBackdropFilter: blurXl,
          boxShadow: light.shadowHover,
          border: `1px solid ${light.hairline}`,
        },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { padding: '22px 24px 10px', fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.35, letterSpacing: '-0.012em' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '14px 24px 18px', lineHeight: 1.6 },
        dividers: { borderColor: light.hairline },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '14px 24px 20px',
          gap: 8,
          borderTop: `1px solid ${light.hairline}`,
          '& > :not(:first-of-type)': { marginInlineStart: 0 },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          backgroundColor: light.fillStrong,
          backdropFilter: blurXl,
          WebkitBackdropFilter: blurXl,
          boxShadow: light.shadowHover,
          border: `1px solid ${light.hairline}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          marginTop: 6,
          backgroundColor: light.fillStrong,
          backdropFilter: blurXl,
          WebkitBackdropFilter: blurXl,
          boxShadow: light.shadowHover,
          border: `1px solid ${light.hairline}`,
        },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 40,
          padding: '8px 12px',
          borderRadius: 8,
          margin: '2px 2px',
          fontSize: '0.875rem',
          transition: 'background-color 120ms cubic-bezier(0.16, 1, 0.3, 1), color 120ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&.Mui-selected': { backgroundColor: 'rgba(15,98,254,0.09)', fontWeight: 600 },
          '&.Mui-selected:hover': { backgroundColor: 'rgba(15,98,254,0.13)' },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: '0.75rem',
          fontWeight: 500,
          lineHeight: 1.45,
          backgroundColor: carbonColors.gray100,
          boxShadow: '0 8px 24px -8px rgba(16,24,40,0.35)',
        },
        arrow: { color: carbonColors.gray100 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid transparent',
          padding: '10px 14px',
          backdropFilter: 'blur(12px)',
          '& .MuiAlert-message': { lineHeight: 1.55 },
        },
        standardSuccess: { borderColor: alpha(carbonColors.green50, 0.28) },
        standardError: { borderColor: alpha(carbonColors.red60, 0.28) },
        standardWarning: { borderColor: alpha(carbonColors.orange40, 0.35) },
        standardInfo: { borderColor: alpha(carbonColors.cyan50, 0.3) },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: light.shadowHover, fontWeight: 500 },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { transition: 'none' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, borderRadius: 999, backgroundColor: alpha(carbonColors.gray20, 0.8) },
        bar: { borderRadius: 999 },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8 },
        rounded: { borderRadius: 12 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: light.hairline },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 46,
          height: 28,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 2,
            '&.Mui-checked': {
              transform: 'translateX(-18px)',
              '& + .MuiSwitch-track': { opacity: 1, backgroundColor: carbonColors.blue60 },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': { boxShadow: focusRing },
          },
          '& .MuiSwitch-thumb': { width: 24, height: 24, boxShadow: '0 1px 3px rgba(16,24,40,0.3)' },
          '& .MuiSwitch-track': { borderRadius: 14, backgroundColor: alpha(carbonColors.gray40, 0.55) },
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          '&:hover': { color: carbonColors.gray100 },
          '&.Mui-active': { color: carbonColors.gray100 },
        },
        icon: { fontSize: '1rem' },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: `1px solid ${light.hairline}`, fontSize: '0.8125rem' },
        toolbar: { minHeight: 52 },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, '&.Mui-selected': { boxShadow: '0 4px 12px -6px rgba(15,98,254,0.5)' } },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.875rem', letterSpacing: '-0.01em' },
        rounded: { borderRadius: 10 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1), color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: carbonColors.gray60,
          lineHeight: 2.2,
        },
      },
    },
  },
});
