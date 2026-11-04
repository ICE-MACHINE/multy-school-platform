import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Box, Typography } from '@mui/material';
import ClassroomSelect from './ClassroomSelect';
import CourseSelect from './CourseSelect';
import { useTranslation } from 'react-i18next';
import { useSchool } from '../../../../hooks/useSchool';

interface AssignClassroomDialogProps {
  open: boolean;
  schoolId?: string;
  teacher: { id: string; firstName: string; lastName: string; classroomId?: string | null; courseId?: string | null } | null;
  onClose: () => void;
  onAssign: (assignmentId: string) => Promise<void>;
}

export default function AssignClassroomDialog({ open, schoolId, teacher, onClose, onAssign }: AssignClassroomDialogProps) {
  const { t } = useTranslation();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [assignmentId, setAssignmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setAssignmentId(isPrivate ? teacher?.courseId || '' : teacher?.classroomId || '');
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await onAssign(assignmentId);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || (isPrivate ? t('teachers.failedAssignCourse') : t('teachers.failedAssignClassroom')));
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      onTransitionEnter={handleOpen}>
      <DialogTitle>{isPrivate ? t('teachers.assignCourseToTeacher') : t('teachers.assignClassroomToTeacher')}</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {teacher && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {teacher.firstName} {teacher.lastName}
          </Typography>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mt: 1 }}>
          {schoolId && (
            isPrivate
              ? <CourseSelect schoolId={schoolId} value={assignmentId} onChange={setAssignmentId} size="medium" fullWidth />
              : <ClassroomSelect schoolId={schoolId} value={assignmentId} onChange={setAssignmentId} size="medium" fullWidth />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
