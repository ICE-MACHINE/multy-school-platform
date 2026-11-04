import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Grid, Button, TextField, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBack from '@mui/icons-material/ArrowBack';
import RoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PageHeader from '../../../components/common/PageHeader';
import DetailCard, { InfoField } from '../../../components/common/DetailCard';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import classroomService from '../../../services/classroomService';
import teacherManagementService from '../../../services/teacherManagementService';
import type { Classroom, Teacher } from '../../../types';

export default function ClassroomDetailPage() {
  const { t } = useTranslation();
  const { schoolId, id } = useParams<{ schoolId: string; id: string }>();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState(30);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [error, setError] = useState('');
  const [capacityWarning, setCapacityWarning] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    if (!schoolId || !id) return;
    setLoading(true);
    try {
      const res = await classroomService.getById(schoolId, id);
      setClassroom(res.data);
    } catch { setClassroom(null); }
    finally { setLoading(false); }
  }, [schoolId, id]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleEditOpen = async () => {
    if (!classroom || !schoolId) return;
    setEditName(classroom.name);
    setEditCapacity(classroom.capacity);
    setEditTeacherId(classroom.teacher?.id || '');
    try {
      const res = await teacherManagementService.getAll(schoolId, { limit: 1000 });
      setTeachers(res.data || []);
    } catch {}
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !id) return;
    const studentCount = classroom?.students?.length || 0;
    if (editCapacity < studentCount) {
      setError(t('classrooms.capacityBelow', { count: studentCount }));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await classroomService.update(schoolId, id, { name: editName, capacity: editCapacity });
      if (editTeacherId !== (classroom?.teacher?.id || '')) {
        await classroomService.assignTeacher(schoolId, id, editTeacherId);
      }
      setClassroom(res.data);
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('common.failedToUpdate'));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!schoolId || !id) return;
    await classroomService.delete(schoolId, id);
    navigate(`/s/${schoolId}/admin/classrooms`);
  };

  if (loading || !classroom) {
    return <Box textAlign="center" py={6}><Typography color="text.secondary">{t('common.loading')}</Typography></Box>;
  }

  const studentCount = classroom.students?.length || 0;
  const usagePct = classroom.capacity ? Math.min(Math.round(studentCount / classroom.capacity * 100), 100) : 0;
  const nearFull = usagePct >= 85;

  return (
    <Box>
      <PageHeader
        title={classroom.name}
        subtitle={t('classrooms.detailSubtitle')}
        actionLabel={t('classrooms.back')}
        onAction={() => navigate(`/s/${schoolId}/admin/classrooms`)}
        actionIcon={<ArrowBack />}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DetailCard title={t('classrooms.info')} icon={<RoomIcon />}>
            <Box display="flex" flexDirection="column" gap={2.5}>
              <InfoField label={t('common.name')} value={classroom.name} />
              <InfoField label={t('classrooms.teacher')} value={
                classroom.teacher
                  ? <Box display="flex" alignItems="center" gap={1}><Avatar sx={{ width: 28, height: 28, bgcolor: '#8b5cf6', fontSize: 13, fontWeight: 700 }}>{classroom.teacher.firstName?.[0]}</Avatar>{`${classroom.teacher.firstName} ${classroom.teacher.lastName}`}</Box>
                  : t('common.notSpecified')
              } />
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">{t('classrooms.occupancy')}</Typography>
                  <Typography variant="body2" fontWeight={700}>{studentCount} / {classroom.capacity}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={usagePct}
                  color={nearFull ? 'warning' : 'success'}
                  sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 5 } }}
                />
              </Box>
            </Box>
            <Box display="flex" gap={1.5} mt={3.5}>
              <Button variant="contained" startIcon={<EditIcon />} onClick={handleEditOpen}>{t('common.edit')}</Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>{t('common.delete')}</Button>
            </Box>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <DetailCard title={t('classrooms.enrolledStudents', { count: studentCount })} icon={<PeopleIcon />} iconColor="#10b981">
            {studentCount === 0 ? (
              <Typography color="text.secondary" py={3} textAlign="center">{t('classrooms.noStudents')}</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[t('students.registrationNumber'), t('common.name'), t('common.status'), ''].map((h, i) => (
                        <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: 0.02, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classroom.students.map((s) => (
                      <TableRow
                        key={s.id}
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                        onClick={() => navigate(`/s/${schoolId}/admin/students/${s.id}`)}
                      >
                        <TableCell><Typography fontWeight={600} variant="body2">{s.registrationNumber}</Typography></TableCell>
                        <TableCell>{s.firstName} {s.lastName}</TableCell>
                        <TableCell><Chip label={s.isActive ? t('common.active') : t('common.inactive')} color={s.isActive ? 'success' : 'default'} size="small" /></TableCell>
                        <TableCell align="left"><ChevronLeftIcon fontSize="small" sx={{ color: 'text.disabled' }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DetailCard>
        </Grid>
      </Grid>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('classrooms.editClassroom')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label={t('common.name')} value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <TextField label={t('courses.capacity')} type="number" value={editCapacity} onChange={(e) => {
              const val = Number(e.target.value);
              setEditCapacity(val);
              const count = classroom?.students?.length || 0;
              setCapacityWarning(val < count ? t('classrooms.capacityBelow', { count }) : '');
            }} fullWidth error={!!capacityWarning} helperText={capacityWarning || undefined} />
            <FormControl fullWidth>
              <InputLabel>{t('classrooms.teacher')}</InputLabel>
              <Select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} label={t('classrooms.teacher')}>
                <MenuItem value="">{t('classrooms.withoutTeacher')}</MenuItem>
                {teachers
                  .filter((t) => !t.classroomId || t.id === editTeacherId)
                  .map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteOpen} title={t('classrooms.deleteClassroom')} message={t('classrooms.deleteConfirm', { name: classroom.name })} confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />
    </Box>
  );
}
