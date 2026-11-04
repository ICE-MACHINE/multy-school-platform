import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, InputLabel, FormControl, FormControlLabel, Switch, Radio, RadioGroup, FormHelperText,
  Checkbox, CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBack from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import GlassSurface from '../../../components/common/GlassSurface';
import CourseProgressTabs from './components/CourseProgressTabs';
import { useTranslation } from 'react-i18next';
import courseService from '../../../services/courseService';
import studentService from '../../../services/studentService';
import teacherManagementService from '../../../services/teacherManagementService';
import { useSchool } from '../../../hooks/useSchool';
import type { Course, Teacher, Student } from '../../../types';

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const { schoolId, id } = useParams<{ schoolId: string; id: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const [course, setCourse] = useState<Course | null>(null);
  const startDateLocked = !!course?.startDate && course.startDate.slice(0, 10) < todayKey;
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [busyTeacherIds, setBusyTeacherIds] = useState<Set<string>>(new Set());
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCapacity, setEditCapacity] = useState(30);
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editHasMonth, setEditHasMonth] = useState(false);
  const [editHasSession, setEditHasSession] = useState(false);
  const [editHasCourse, setEditHasCourse] = useState(false);
  const [editPriceMonth, setEditPriceMonth] = useState(0);
  const [editPriceSession, setEditPriceSession] = useState(0);
  const [editPriceCourse, setEditPriceCourse] = useState(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editNumberOfSessions, setEditNumberOfSessions] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const fetch = useCallback(async () => {
    if (!schoolId || !id) return;
    setLoading(true);
    try {
      const res = await courseService.getById(schoolId, id);
      setCourse(res.data);
    } catch { setCourse(null); }
    finally { setLoading(false); }
  }, [schoolId, id]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleEditOpen = async () => {
    if (!course || !schoolId) return;
    setEditName(course.name);
    setEditDescription(course.description || '');
    setEditCapacity(course.capacity);
    setEditTeacherId(course.teacher?.id || '');
    setEditHasMonth(course.hasMonthOption);
    setEditHasSession(course.hasSessionOption);
    setEditHasCourse(course.hasCourseOption);
    setEditPriceMonth(course.pricePerMonth || 0);
    setEditPriceSession(course.pricePerSession || 0);
    setEditPriceCourse(course.pricePerCourse || 0);
    setEditStartDate(course.startDate || '');
    setEditNumberOfSessions(course.numberOfSessions || 0);
    try {
      const tRes = await teacherManagementService.getAll(schoolId);
      setTeachers(tRes.data || []);
      const cRes = await courseService.getAll(schoolId);
      const busy = new Set<string>();
      (cRes.data || []).forEach((c) => { if (c.id !== id && c.teacherId) busy.add(c.teacherId); });
      setBusyTeacherIds(busy);
    } catch {}
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!schoolId || !id) return;
    setSaving(true);
    setError('');
    try {
      const res = await courseService.update(schoolId, id, {
        name: editName,
        description: editDescription,
        capacity: editCapacity,
        teacherId: editTeacherId || undefined,
        hasMonthOption: editHasMonth,
        hasSessionOption: editHasSession,
        hasCourseOption: editHasCourse,
        pricePerMonth: editHasMonth ? editPriceMonth : undefined,
        pricePerSession: editHasSession ? editPriceSession : undefined,
        pricePerCourse: editHasCourse ? editPriceCourse : undefined,
        startDate: isPrivate && editHasMonth ? editStartDate : undefined,
        numberOfSessions: isPrivate && editHasSession ? editNumberOfSessions : undefined,
      });
      setCourse(res.data);
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('common.failedToUpdate'));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!schoolId || !id) return;
    await courseService.delete(schoolId, id);
    navigate(`/s/${schoolId}/admin/courses`);
  };

  const openEnroll = async () => {
    if (!schoolId) return;
    setEnrollOpen(true);
    setSelectedStudentIds([]);
    setStudentSearch('');
    setEnrollError('');
    try {
      const res = await studentService.getAll(schoolId, { limit: 200 });
      setAllStudents(res.data || []);
    } catch {}
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => (prev.includes(studentId) ? prev.filter((x) => x !== studentId) : [...prev, studentId]));
  };

  const handleEnrollStudents = async () => {
    if (!schoolId || !id || selectedStudentIds.length === 0) return;
    setEnrolling(true);
    setEnrollError('');
    try {
      for (const studentId of selectedStudentIds) {
        await courseService.enrollStudent(schoolId, id, studentId);
      }
      setEnrollOpen(false);
      fetch();
    } catch (err: any) {
      setEnrollError(err?.response?.data?.message || t('courses.failedToEnroll'));
    } finally { setEnrolling(false); }
  };

  const sectionAnim = {
    animation: 'fadeInUp 350ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (!course) {
    return <Alert severity="error" sx={{ borderRadius: 3 }}>{t('courses.notFound')}</Alert>;
  }

  const enrolledCount = course.enrolledStudents?.length || 0;

  return (
    <Box>
      <PageHeader
        title={course.name}
        subtitle={course.description || ''}
        actionLabel={t('classrooms.back')}
        onAction={() => navigate(`/s/${schoolId}/admin/courses`)}
        actionIcon={<ArrowBack />}
      />

      <GlassSurface sx={{ p: 2.5, mb: 3, borderRadius: 4, ...sectionAnim }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
              <SchoolIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>{course.name}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.25}>
                {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : t('common.notSpecified')}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              size="small"
              label={t('courses.enrolledChip', { enrolled: enrolledCount, capacity: course.capacity })}
              color={enrolledCount > 0 ? 'primary' : 'default'}
              sx={{ fontWeight: 600 }}
            />
            {course.hasMonthOption && <Chip size="small" label={t('students.priceChip', { price: course.pricePerMonth, unit: t('students.unitMonth') })} color="primary" variant="outlined" />}
            {course.hasSessionOption && <Chip size="small" label={t('students.priceChip', { price: course.pricePerSession, unit: t('students.unitSession') })} color="secondary" variant="outlined" />}
            {course.hasCourseOption && <Chip size="small" label={t('students.priceChip', { price: course.pricePerCourse, unit: t('students.unitCourse') })} color="warning" variant="outlined" />}
          </Box>
        </Box>
      </GlassSurface>

      <Box display="flex" flexDirection="column" gap={2.5}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2.5}>
          <GlassSurface sx={{ p: 2.5, borderRadius: 4, flex: { xs: '1', md: '0 0 340px' }, ...sectionAnim }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
                  <SchoolIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight={700}>{t('courses.courseDetailsTitle')}</Typography>
              </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
              <InfoRow label={t('common.description')} value={course.description || '—'} />
              <InfoRow label={t('courses.capacity')} value={String(course.capacity)} />
              <InfoRow label={t('classrooms.teacher')} value={course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : t('common.notSpecified')} />
              <InfoRow label={t('courses.enrolledCountLabel')} value={`${enrolledCount} / ${course.capacity}`} />
              {isPrivate && course.hasMonthOption && (
                <InfoRow label={t('courses.startDate')} value={course.startDate ? new Date(course.startDate).toLocaleDateString() : '—'} />
              )}
              {isPrivate && course.hasSessionOption && (
                <InfoRow label={t('courses.numberOfSessions')} value={String(course.numberOfSessions ?? '—')} />
              )}
            </Box>
            <Box display="flex" gap={1} mt={3}>
              <Button variant="contained" startIcon={<EditIcon />} onClick={handleEditOpen} sx={{ borderRadius: 999 }}>
                {t('common.edit')}
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} sx={{ borderRadius: 999 }}>
                {t('common.delete')}
              </Button>
            </Box>
          </GlassSurface>

          <GlassSurface sx={{ p: 2.5, borderRadius: 4, flex: 1, minWidth: 0, ...sectionAnim }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
                  <PeopleIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight={700}>{t('courses.enrolledStudents')}</Typography>
              </Box>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={openEnroll} sx={{ borderRadius: 999 }}>
                {t('courses.enrollStudents')}
              </Button>
            </Box>
            {(!course.enrolledStudents || course.enrolledStudents.length === 0) ? (
              <Box py={4} textAlign="center">
                <Typography color="text.secondary">{t('courses.noStudentsInSubject')}</Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('students.registrationNumber')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('common.name')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {course.enrolledStudents.map((s) => (
                      <TableRow
                        key={s.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/s/${schoolId}/admin/students/${s.id}`)}
                      >
                        <TableCell>{s.registrationNumber}</TableCell>
                        <TableCell>
                          <Typography fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </GlassSurface>
        </Box>

        {isPrivate && <CourseProgressTabs schoolId={schoolId} courseId={id} />}
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('courses.editSubject')}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField label={t('common.name')} value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
            <TextField label={t('common.description')} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} fullWidth multiline rows={2} />
            <TextField label={t('courses.capacity')} type="number" value={editCapacity} onChange={(e) => setEditCapacity(Number(e.target.value))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>{t('classrooms.teacher')}</InputLabel>
              <Select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)} label={t('classrooms.teacher')} error={!!editTeacherId && busyTeacherIds.has(editTeacherId)}>
                <MenuItem value="">{t('classrooms.withoutTeacher')}</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id} disabled={busyTeacherIds.has(teacher.id)}>
                    {teacher.firstName} {teacher.lastName}{busyTeacherIds.has(teacher.id) ? t('courses.teachesAnother') : ''}
                  </MenuItem>
                ))}
              </Select>
              {!!editTeacherId && busyTeacherIds.has(editTeacherId) && (
                <FormHelperText error>{t('courses.teacherBusy')}</FormHelperText>
              )}
            </FormControl>
            <Typography variant="subtitle2" fontWeight={700}>{t('payments.paymentType')}</Typography>
            {isPrivate ? (
              <>
                <RadioGroup row value={editHasCourse ? 'course' : editHasSession ? 'session' : 'month'}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditHasMonth(v === 'month');
                    setEditHasSession(v === 'session');
                    setEditHasCourse(v === 'course');
                  }}>
                  <FormControlLabel value="month" control={<Radio />} label={t('payments.monthly')} />
                  <FormControlLabel value="session" control={<Radio />} label={t('payments.perSession')} />
                  <FormControlLabel value="course" control={<Radio />} label={t('payments.perCourse')} />
                </RadioGroup>
                {editHasMonth && (
                  <>
                    <TextField label={t('courses.monthlyPrice')} type="number" value={editPriceMonth} onChange={(e) => setEditPriceMonth(Number(e.target.value))} fullWidth />
                    <TextField
                      label={t('courses.courseStartDate')}
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      fullWidth
                      disabled={startDateLocked}
                      helperText={startDateLocked ? t('courses.startDateCannotChange') : undefined}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </>
                )}
                {editHasSession && (
                  <>
                    <TextField label={t('courses.sessionPrice')} type="number" value={editPriceSession} onChange={(e) => setEditPriceSession(Number(e.target.value))} fullWidth />
                    <TextField label={t('courses.numberOfSessions')} type="number" value={editNumberOfSessions} onChange={(e) => setEditNumberOfSessions(Number(e.target.value))} fullWidth />
                  </>
                )}
                {editHasCourse && (
                  <TextField label={t('courses.coursePrice')} type="number" value={editPriceCourse} onChange={(e) => setEditPriceCourse(Number(e.target.value))} fullWidth />
                )}
              </>
            ) : (
              <>
                <FormControlLabel control={<Switch checked={editHasMonth} onChange={(e) => setEditHasMonth(e.target.checked)} />} label={t('payments.monthly')} />
                {editHasMonth && <TextField label={t('courses.monthlyPrice')} type="number" value={editPriceMonth} onChange={(e) => setEditPriceMonth(Number(e.target.value))} fullWidth />}
                <FormControlLabel control={<Switch checked={editHasSession} onChange={(e) => setEditHasSession(e.target.checked)} />} label={t('courses.bySession')} />
                {editHasSession && <TextField label={t('courses.sessionPriceAlt')} type="number" value={editPriceSession} onChange={(e) => setEditPriceSession(Number(e.target.value))} fullWidth />}
                <FormControlLabel control={<Switch checked={editHasCourse} onChange={(e) => setEditHasCourse(e.target.checked)} />} label={t('payments.perCourse')} />
                {editHasCourse && <TextField label={t('courses.coursePrice')} type="number" value={editPriceCourse} onChange={(e) => setEditPriceCourse(Number(e.target.value))} fullWidth />}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 999 }}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={deleteOpen} title={t('courses.deleteSubject')} message={t('classrooms.deleteConfirm', { name: course.name })} confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />

      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('courses.enrollInCourseTitle')}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {enrollError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{enrollError}</Alert>}
          <TextField
            label={t('courses.searchStudent')}
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            fullWidth
            size="small"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                bgcolor: 'action.hover',
                '&.Mui-focused': { bgcolor: 'background.paper' },
                '& fieldset': { border: 'none' },
              },
            }}
          />
          {(() => {
            const enrolledIds = new Set((course.enrolledStudents || []).map((s) => s.id));
            const q = studentSearch.trim().toLowerCase();
            const available = allStudents
              .filter((s) => !enrolledIds.has(s.id))
              .filter((s) => !q || `${s.firstName} ${s.lastName} ${s.registrationNumber || ''}`.toLowerCase().includes(q));
            return available.length === 0 ? (
              <Typography color="text.secondary" py={3} textAlign="center">{t('courses.noAvailableStudents')}</Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={0.75} sx={{ maxHeight: 360, overflow: 'auto' }}>
                {available.map((s) => (
                  <Box
                    key={s.id}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer',
                      border: '1px solid', borderColor: 'divider',
                      bgcolor: selectedStudentIds.includes(s.id) ? 'action.hover' : 'transparent',
                      transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => toggleStudent(s.id)}
                  >
                    <Checkbox checked={selectedStudentIds.includes(s.id)} size="small" />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{s.firstName} {s.lastName}</Typography>
                      {s.registrationNumber && <Typography variant="caption" color="text.secondary">{s.registrationNumber}</Typography>}
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEnrollOpen(false)} disabled={enrolling}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleEnrollStudents} disabled={enrolling || selectedStudentIds.length === 0} sx={{ borderRadius: 999 }}>
            {enrolling ? t('courses.enrolling') : t('courses.enrollCount', { count: selectedStudentIds.length })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
