import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Grid, Chip, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DateIcon from '@mui/icons-material/CalendarMonth';
import SessionsIcon from '@mui/icons-material/Numbers';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import courseService from '../../../services/courseService';
import { useSchool } from '../../../hooks/useSchool';
import type { Course } from '../../../types';

export default function CoursesListPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [courses, setCourses] = useState<Course[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    try { const res = await courseService.getAll(schoolId); setCourses(res.data || []); }
    catch {}
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget || !schoolId) return;
    await courseService.delete(schoolId, deleteTarget.id);
    fetch();
    setDeleteTarget(null);
  };

  return (
    <Box>
      <PageHeader title={t('courses.subjects')} subtitle={t('courses.manageSubjects')} actionLabel={t('courses.addSubject')} onAction={() => navigate(`/s/${schoolId}/admin/courses/create`)} />
      <Grid container spacing={3}>
        {courses.map((c) => (
          <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }} onClick={() => navigate(`/s/${schoolId}/admin/courses/${c.id}`)}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Typography fontWeight={600}>{c.name}</Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>{c.description}</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {c.hasMonthOption && <Chip label={t('students.priceChip', { price: c.pricePerMonth, unit: t('students.unitMonth') })} size="small" color="primary" />}
                      {c.hasSessionOption && <Chip label={t('students.priceChip', { price: c.pricePerSession, unit: t('students.unitSession') })} size="small" color="secondary" />}
                      {c.hasCourseOption && <Chip label={t('students.priceChip', { price: c.pricePerCourse, unit: t('students.unitCourse') })} size="small" color="warning" />}
                    </Box>
                    {isPrivate && c.hasMonthOption && c.startDate && (
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.75}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">{t('courses.startsOn', { date: new Date(c.startDate).toLocaleDateString() })}</Typography>
                      </Box>
                    )}
                    {isPrivate && c.hasSessionOption && !!c.numberOfSessions && (
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.75}>
                        <SessionsIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">{t('courses.sessionsChip', { count: c.numberOfSessions })}</Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" mt={1} display="block">
                      {t('courses.enrolledChip', { enrolled: c.enrolledStudents?.length || 0, capacity: c.capacity })}
                    </Typography>
                  </Box>
                  <Tooltip title={t('common.delete')}><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <ConfirmDialog open={!!deleteTarget} title={t('courses.deleteSubject')} message={t('classrooms.deleteConfirm', { name: deleteTarget?.name })} confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Box>
  );
}
