import { Box, CircularProgress, Typography } from '@mui/material';
interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({ message, fullPage }: LoadingSpinnerProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2.25}
      py={3}
      sx={{
        animation: 'fadeInUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <CircularProgress size={42} thickness={3.6} sx={{ transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, textAlign: 'center' }}>
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        px={2}
      >
        {content}
      </Box>
    );
  }

  return content;
}
