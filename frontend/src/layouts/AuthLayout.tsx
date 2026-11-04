import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import { ambientBackground } from '../theme/glass';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const theme = useTheme();
  const mode = theme.palette.mode === 'dark' ? 'dark' : 'light';

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        background: ambientBackground(mode),
        backgroundAttachment: 'fixed',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  );
}
