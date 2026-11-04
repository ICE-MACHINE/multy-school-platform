import { Box, Typography, IconButton, Collapse, Divider, Button, Chip, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GlassSurface from '../../../../components/common/GlassSurface';
import type { ProgramLike } from '../types';
import { useTranslation } from 'react-i18next';


interface ProgramTreeProps {
  program: ProgramLike | null;
  programLoading: boolean;
  expandedModules: Record<string, boolean>;
  onToggleModule: (id: string) => void;
  onCreateProgram: () => void;
  onEditProgram: () => void;
  onDeleteProgram: () => void;
  onAddModule: () => void;
  onEditModule: (mod: { id: string; title: string }) => void;
  onDeleteModule: (id: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (moduleId: string, lesson: { id: string; title: string }) => void;
  onDeleteLesson: (id: string) => void;
}

export default function ProgramTree({
  program, programLoading, expandedModules, onToggleModule,
  onCreateProgram, onEditProgram, onDeleteProgram, onAddModule, onEditModule, onDeleteModule,
  onAddLesson, onEditLesson, onDeleteLesson,
}: ProgramTreeProps) {
  const { t } = useTranslation();
  return (
    <GlassSurface sx={{ p: 2.5, borderRadius: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>{t('program.curriculum')}</Typography>
        {program && (
          <Box display="flex" gap={0.5}>
            <IconButton size="small" onClick={onEditProgram}><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={onDeleteProgram}><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        )}
      </Box>
      {program?.description && <Typography variant="body2" color="text.secondary" mb={2}>{program.description}</Typography>}
      {programLoading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : !program ? (
        <Box py={3} textAlign="center">
          <Typography color="text.secondary" mb={2}>{t('program.noProgramYet')}</Typography>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={onCreateProgram}>{t('program.createProgram')}</Button>
        </Box>
      ) : (
        <>
          <Box display="flex" justifyContent="flex-end" mb={1.5}>
            <Button size="small" startIcon={<AddIcon />} onClick={onAddModule}>{t('program.addModule')}</Button>
          </Box>
          {program.modules && program.modules.length > 0 ? program.modules.map((mod) => (
        <GlassSurface key={mod.id} sx={{ mb: 1.5, borderRadius: 3, overflow: 'hidden' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1.25}>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton size="small" onClick={() => onToggleModule(mod.id)}>
                {expandedModules[mod.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <Typography fontWeight={700} variant="subtitle2">{mod.title}</Typography>
              <Chip size="small" label={t('program.lessonsCount', { count: mod.lessons?.length || 0 })} variant="outlined" />
            </Box>
            <Box display="flex" gap={0.5}>
              <IconButton size="small" onClick={() => onEditModule(mod)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => onDeleteModule(mod.id)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          </Box>
          <Collapse in={expandedModules[mod.id]} timeout="auto">
            <Box px={2.5} pb={2}>
              {mod.lessons && mod.lessons.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {mod.lessons.map((l, i) => (
                    <Box key={l.id}>
                      {i > 0 && <Divider sx={{ my: 0.5 }} />}
                      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 0, py: 0.75, '&:hover': { bgcolor: 'action.hover', borderRadius: 2 } }}>
                        <Typography variant="body2" fontWeight={500} sx={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</Typography>
                        <Box display="flex" gap={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                          <IconButton size="small" onClick={() => onEditLesson(mod.id, l)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => onDeleteLesson(l.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" py={1.5} textAlign="center">{t('program.noLessonsInModule')}</Typography>
              )}
              <Button size="small" startIcon={<AddIcon />} onClick={() => onAddLesson(mod.id)} sx={{ mt: 1 }}>{t('program.addLesson')}</Button>
            </Box>
          </Collapse>
        </GlassSurface>
      )) : (
        <Box py={3} textAlign="center"><Typography color="text.secondary">{t('program.noModulesYet')}</Typography></Box>
      )}
        </>
      )}
    </GlassSurface>
  );
}
