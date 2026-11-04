import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, Chip, Avatar, Typography, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignIcon from '@mui/icons-material/MeetingRoom';
import PhoneIcon from '@mui/icons-material/Phone';
import GenderIcon from '@mui/icons-material/Wc';
import BirthIcon from '@mui/icons-material/Cake';
import TeacherIcon from '@mui/icons-material/Group';
import ActivityIcon from '@mui/icons-material/EmojiEvents';
import DateIcon from '@mui/icons-material/Today';
import PeriodIcon from '@mui/icons-material/Schedule';
import DetailCard, { InfoField } from '../../../components/common/DetailCard';
import ProfileHeader from '../../../components/common/ProfileHeader';
import ActionsMenu from '../../../components/common/ActionsMenu';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EditTeacherDialog from './EditTeacherDialog';
import AssignClassroomDialog from './components/AssignClassroomDialog';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import teacherManagementService from '../../../services/teacherManagementService';
import { useSchool } from '../../../hooks/useSchool';
import type { Teacher, Activity, ActivityCategory, ActivityPeriod } from '../../../types';

const getCategoryLabels = (t: TFunction): Record<ActivityCategory, string> => ({
  physical: t('admin.activityCategories.physical'),
  creative: t('admin.activityCategories.creative'),
  cognitive: t('admin.activityCategories.cognitive'),
  social: t('admin.activityCategories.social'),
  moral: t('admin.activityCategories.moral'),
  linguistic: t('admin.activityCategories.linguistic'),
});

const getPeriodLabels = (t: TFunction): Record<ActivityPeriod, string> => ({ morning: t('attendance.morning'), afternoon: t('attendance.evening') });

export default function TeacherDetailPage() {
  const { t } = useTranslation();
  const CATEGORY_LABELS = getCategoryLabels(t);
  const PERIOD_LABELS = getPeriodLabels(t);
  const { schoolId, id } = useParams<{ schoolId: string; id: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (schoolId && id) teacherManagementService.getById(schoolId, id).then((res) => setTeacher(res.data));
  }, [schoolId, id]);

  const handleSave = async (data: any) => {
    if (!schoolId || !id) return;
    await teacherManagementService.update(schoolId, id, data);
    const res = await teacherManagementService.getById(schoolId, id);
    setTeacher(res.data);
  };

  const handleAssign = async (assignmentId: string) => {
    if (!schoolId || !id) return;
    const payload = isPrivate ? { courseId: assignmentId || null } : { classroomId: assignmentId || null };
    await teacherManagementService.update(schoolId, id, payload);
    const res = await teacherManagementService.getById(schoolId, id);
    setTeacher(res.data);
  };

  const handleDelete = async () => {
    if (!schoolId || !id) return;
    setDeleteLoading(true);
    try {
      await teacherManagementService.delete(schoolId, id);
      navigate(`/s/${schoolId}/admin/teachers`);
    } catch {} finally { setDeleteLoading(false); setDeleteOpen(false); }
  };

  if (!teacher) return null;

  return (
    <Box>
      <ProfileHeader
        name={`${teacher.firstName} ${teacher.lastName}`}
        avatarText={`${teacher.firstName[0]}${teacher.lastName[0]}`}
        avatarGradient={teacher.gender === 'female' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'linear-gradient(135deg, #6366f1, #4f46e5)'}
        subtitle={
          <Chip
            label={isPrivate
              ? (teacher.course ? t('teachers.courseLabel', { name: teacher.course.name }) : t('teachers.withoutCourse'))
              : (teacher.classroom ? t('teachers.classroomLabel', { name: teacher.classroom.name }) : t('teachers.withoutClassroom'))}
            size="small"
            variant="outlined"
            icon={<AssignIcon />}
          />
        }
        backLabel={t('teachers.backToTeachers')}
        onBack={() => navigate(`/s/${schoolId}/admin/teachers`)}
        action={
          <ActionsMenu items={[
            { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditOpen(true) },
            { label: isPrivate ? t('teachers.assignCourse') : t('teachers.assignClassroom'), icon: <AssignIcon fontSize="small" />, onClick: () => setAssignOpen(true) },
            { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => setDeleteOpen(true) },
          ]} />
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailCard title={t('teachers.contactData')} icon={<PhoneIcon />}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6 }}><InfoField label={t('common.phone')} value={teacher.phone} /></Grid>
              <Grid size={{ xs: 6 }}>
                <InfoField label={t('common.gender')} value={<Box display="flex" alignItems="center" gap={0.5}><GenderIcon fontSize="small" color="action" />{teacher.gender === 'female' ? t('common.female') : t('common.male')}</Box>} />
              </Grid>
            </Grid>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DetailCard title={t('teachers.teachingData')} icon={<TeacherIcon />} iconColor="#8b5cf6">
            <Grid container spacing={3}>
              <Grid size={{ xs: 6 }}>
                <InfoField label={t('students.dateOfBirth')} value={
                  teacher.dateOfBirth
                    ? <Box display="flex" alignItems="center" gap={0.5}><BirthIcon fontSize="small" color="action" />{teacher.dateOfBirth}</Box>
                    : t('common.notAvailable')
                } />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <InfoField label={isPrivate ? t('teachers.course') : t('teachers.classroom')} value={
                  isPrivate
                    ? (teacher.course
                      ? <Box display="flex" alignItems="center" gap={0.5}><Avatar sx={{ width: 28, height: 28, bgcolor: '#8b5cf6', fontSize: 13, fontWeight: 700 }}>{teacher.course.name?.[0]}</Avatar>{teacher.course.name}</Box>
                      : t('teachers.unassigned'))
                    : (teacher.classroom
                      ? <Box display="flex" alignItems="center" gap={0.5}><Avatar sx={{ width: 28, height: 28, bgcolor: '#8b5cf6', fontSize: 13, fontWeight: 700 }}>{teacher.classroom.name?.[0]}</Avatar>{teacher.classroom.name}</Box>
                      : t('teachers.unassigned'))
                } />
              </Grid>
            </Grid>
          </DetailCard>
        </Grid>
      </Grid>

      {schoolType === 'kindergarten' && (
        <DetailCard title={t('teachers.managedActivities')} icon={<ActivityIcon />} iconColor="#f59e0b" sx={{ mt: 3 }}>
          {teacher.activities && teacher.activities.length > 0 ? (
            <List disablePadding>
              {teacher.activities.map((a: Activity) => (
                <ListItem
                  key={a.id}
                  sx={{
                    borderRadius: 3,
                    mb: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    flexWrap: { xs: 'wrap' },
                    gap: 1,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#f59e0b', fontWeight: 700 }}>{a.title?.[0] || '?'}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography fontWeight={600} variant="body2">{a.title}</Typography>
                        <Chip label={CATEGORY_LABELS[a.category] || a.category} size="small" sx={{ height: 20, fontSize: 11 }} />
                        <Chip
                          label={a.status === 'completed' ? t('teachers.completed') : t('teachers.scheduled')}
                          size="small"
                          color={a.status === 'completed' ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: 11 }}
                        />
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box display="flex" alignItems="center" gap={1.5} mt={0.5} flexWrap="wrap">
                        <Typography component="span" variant="caption" display="inline-flex" alignItems="center" gap={0.5} sx={{ color: 'text.secondary' }}>
                          <DateIcon fontSize="inherit" /> {a.date}
                        </Typography>
                        <Typography component="span" variant="caption" display="inline-flex" alignItems="center" gap={0.5} sx={{ color: 'text.secondary' }}>
                          <PeriodIcon fontSize="inherit" /> {PERIOD_LABELS[a.period] || a.period}
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <Chip
                    icon={<AssignIcon fontSize="small" />}
                    label={t('teachers.classroomChip', { name: a.classroom?.name || t('teachers.notSpecifiedClassroom') })}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" py={2} textAlign="center">{t('teachers.noActivities')}</Typography>
          )}
        </DetailCard>
      )}

      <EditTeacherDialog open={editOpen} teacher={teacher} schoolId={schoolId} onClose={() => setEditOpen(false)} onSave={handleSave} />
      <AssignClassroomDialog open={assignOpen} schoolId={schoolId} teacher={teacher} onClose={() => setAssignOpen(false)} onAssign={handleAssign} />
      <ConfirmDialog open={deleteOpen} title={t('teachers.deleteTeacher')} message={t('teachers.deleteConfirm', { firstName: teacher.firstName, lastName: teacher.lastName })}
        confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} loading={deleteLoading} />
    </Box>
  );
}
