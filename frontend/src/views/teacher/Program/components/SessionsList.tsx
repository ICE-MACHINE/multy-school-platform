import { Box, Typography, Button, Chip, Divider } from '@mui/material';
import DoneIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AttendanceIcon from '@mui/icons-material/HowToReg';
import GlassSurface from '../../../../components/common/GlassSurface';
import type { CourseSession } from '../../../../types';
import { useTranslation } from 'react-i18next';


interface SessionsListProps {
  sessions: CourseSession[];
  onOpenAttendance: (s: CourseSession) => void;
  onRemoveSession: (s: CourseSession) => void;
}

export default function SessionsList({ sessions, onOpenAttendance, onRemoveSession }: SessionsListProps) {
  const { t } = useTranslation();
  return (
    <GlassSurface sx={{ p: 2.5, borderRadius: 4 }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
          <AttendanceIcon fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={700}>{t('program.sessionsRecord')}</Typography>
      </Box>
      {sessions.length === 0 ? (
        <Box py={2} textAlign="center"><Typography color="text.secondary">{t('program.noSessionsYet')}</Typography></Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={1}>
          {sessions.map((s, i) => (
            <Box key={s.id}>
              {i > 0 && <Divider sx={{ my: 1 }} />}
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ px: 0, py: 1, '&:hover': { bgcolor: 'action.hover', borderRadius: 2 } }}>
                <Box width="100%">
                  <Box display="flex" alignItems="center" gap={1.5} mb={0.75} flexWrap="wrap">
                    <Typography fontWeight={700}>{t('program.session', { number: s.sessionNumber })}</Typography>
                    {s.completed ? <Chip size="small" icon={<DoneIcon />} label={t('program.completedOn', { date: s.completedAt || '' })} color="success" /> : <Chip size="small" label={t('program.notCompleted')} color="default" />}
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {s.lessons.length > 0 ? s.lessons.map((l) => <Chip key={l.id} label={l.title} size="small" variant="outlined" color="primary" />) : <Typography variant="caption" color="text.secondary">{t('program.noLessons')}</Typography>}
                  </Box>
                </Box>
                <Box display="flex" gap={0.5} sx={{ flexShrink: 0, ml: 1, mt: 0.5 }}>
                  {s.completed && <Button size="small" startIcon={<AttendanceIcon />} onClick={() => onOpenAttendance(s)}>{t('program.attendance')}</Button>}
                  <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => onRemoveSession(s)}>{t('common.cancel')}</Button>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </GlassSurface>
  );
}
