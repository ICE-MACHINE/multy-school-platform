import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext/ThemeContext';

export const useTheme = () => useContext(ThemeContext);
