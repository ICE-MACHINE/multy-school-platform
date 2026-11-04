import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, Avatar, IconButton, Tooltip, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import classroomService from '../../../services/classroomService';
import type { Classroom } from '../../../types';

export default function ClassroomsListPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Classroom | null>(null);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try { const res = await classroomService.getAll(schoolId); setClassrooms(res.data || []); }
    catch {} finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget || !schoolId) return;
    setError('');
    try {
      await classroomService.delete(schoolId, deleteTarget.id);
      fetch();
    } catch (err: any) {
      setError(err?.response?.data?.message || t('classrooms.failedToDelete'));
    } finally { setDeleteTarget(null); }
  };

  return (
    <Box>
      <PageHeader title={t('classrooms.classrooms')} subtitle={t('classrooms.manage')} actionLabel={t('classrooms.addClassroom')} onAction={() => navigate(`/s/${schoolId}/admin/classrooms/create`)} />
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={3}>
        {classrooms.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }} onClick={() => navigate(`/s/${schoolId}/admin/classrooms/${c.id}`)}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: '#6366f1' }}>{c.name[0]}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{c.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{t('classrooms.seats', { count: c.capacity })}</Typography>
                      <Typography variant="caption" color="text.secondary">{t('classrooms.teacherLabel', { name: c.teacher?.firstName || t('common.notSpecified') })}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">{t('classrooms.studentsCount', { count: c.students?.length || 0 })}</Typography>
                    </Box>
                  </Box>
                  <Tooltip title={t('common.delete')}><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <ConfirmDialog open={!!deleteTarget} title={t('classrooms.deleteClassroom')} message={t('classrooms.deleteConfirm', { name: deleteTarget?.name })} confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
