import { TextField, InputAdornment, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useTranslation } from 'react-i18next';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  sx?: object;
}

export default function SearchInput({ value, onChange, placeholder, fullWidth = true, sx }: SearchInputProps) {
  const { t } = useTranslation();
  const placeholderLabel = placeholder ?? t('common.search');
  const theme = useTheme();
  return (
    <TextField
      fullWidth={fullWidth}
      size="small"
      placeholder={placeholderLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 999,
          bgcolor: 'action.hover',
          transition: 'border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            bgcolor: 'action.selected',
          },
          '&.Mui-focused': {
            bgcolor: 'background.paper',
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
          },
          '& fieldset': { border: 'none' },
        },
        ...sx,
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
}
