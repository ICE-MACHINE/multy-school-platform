import type { SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

export const pillFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 999,
    bgcolor: 'action.hover',
    transition:
      'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': { bgcolor: 'action.selected' },
    '&.Mui-focused': {
      bgcolor: 'background.paper',
      boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
    },
    '& fieldset': { border: 'none' },
  },
};
