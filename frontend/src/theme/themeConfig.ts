import type { Theme } from '@mui/material/styles';
import { carbonTheme } from './carbonTheme';
import { carbonDarkTheme } from './carbonDarkTheme';

export const getTheme = (mode: 'light' | 'dark'): Theme => {
  return mode === 'light' ? carbonTheme : carbonDarkTheme;
};

export { carbonTheme, carbonDarkTheme };
