import { useState, useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { enUS, frFR, arEG } from '@mui/material/locale';
import { useTranslation } from 'react-i18next';
import { getTheme } from '../../theme/themeConfig';
import { ThemeContext } from './ThemeContext';
import { isRtlLanguage } from '../../i18n';

const MUI_LOCALES = { en: enUS, fr: frFR, ar: arEG } as const;

export function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage || 'en') as keyof typeof MUI_LOCALES;
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  const theme = useMemo(
    () => createTheme(getTheme(mode), { direction: isRtlLanguage(language) ? 'rtl' : 'ltr' }, MUI_LOCALES[language] ?? enUS),
    [mode, language],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
