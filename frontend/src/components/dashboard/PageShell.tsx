import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface PageShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function PageShell({ title, subtitle, action, children }: PageShellProps) {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: { xs: 2, md: 3 },
          pb: { xs: 2, md: 0 },
          borderBottom: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 300,
              fontSize: { xs: '1.5rem', md: '2.625rem' },
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: { xs: 0.25, md: 0.5 } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box sx={{ mt: { xs: 1.5, md: 0 } }}>{action}</Box>}
      </Box>
      {children}
    </Box>
  );
}
