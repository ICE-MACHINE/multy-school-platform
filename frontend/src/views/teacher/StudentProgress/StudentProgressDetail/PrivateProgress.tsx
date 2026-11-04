import { Box, Typography } from '@mui/material';
import type { Student } from '../../../../types';
import { useTranslation } from 'react-i18next';


export default function PrivateProgress({ student }: { student: Student }) {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography color="text.secondary">{t('progress.privatePlaceholder')}</Typography>
    </Box>
  );
}
