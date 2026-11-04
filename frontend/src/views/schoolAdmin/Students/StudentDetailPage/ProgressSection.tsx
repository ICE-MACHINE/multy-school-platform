import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, IconButton, List, ListItem, ListItemText, Collapse, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import { useSchool } from '../../../../hooks/useSchool';
import courseService from '../../../../services/courseService';
import studentService from '../../../../services/studentService';
import activityService from '../../../../services/activityService';
import UnenrollCourseDialog from '../../Courses/components/UnenrollCourseDialog';
import QuranProgressView from '../../../../views/shared/QuranProgressView';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Student, Course, Activity } from '../../../../types';

function courseMethod(t: TFunction, c: { pricePerMonth?: number; pricePerSession?: number; pricePerCourse?: number; hasMonthOption: boolean; hasSessionOption: boolean; hasCourseOption: boolean }): { type: 'month' | 'session' | 'course'; label: string; price: number } | null {
  if (c.hasCourseOption) return { type: 'course', label: t('courses.fullCoursePayment'), price: c.pricePerCourse ?? 0 };
  if (c.hasMonthOption) return { type: 'month', label: t('payments.monthly'), price: c.pricePerMonth ?? 0 };
  if (c.hasSessionOption) return { type: 'session', label: t('payments.perSession'), price: c.pricePerSession ?? 0 };
  return null;
}

const getStatusMap = (t: TFunction): Record<string, { label: string; color: 'success' | 'error' | 'default' | 'info' }> => ({
  completed: { label: t('students.statusCompleted'), color: 'success' },
  absent: { label: t('students.statusAbsentLesson'), color: 'error' },
  not_started: { label: t('students.statusNotStarted'), color: 'default' },
  not_enrolled: { label: t('students.statusNotEnrolled'), color: 'info' },
});

function LessonTable({ lessons }: { lessons: { id: string; title: string; status: string; completedAt?: string }[] }) {
  const { t } = useTranslation();
  const STATUS_MAP = getStatusMap(t);
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>{t('students.lesson')}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t('students.completionDate')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lessons.map((lesson) => {
            const st = STATUS_MAP[lesson.status] || STATUS_MAP.not_started;
            return (
              <TableRow key={lesson.id}>
                <TableCell>{lesson.title}</TableCell>
                <TableCell>
                  <Chip size="small" label={st.label} color={st.color} variant={lesson.status === 'not_started' || lesson.status === 'not_enrolled' ? 'outlined' : 'filled'} />
                </TableCell>
                <TableCell>{lesson.completedAt || '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function PrivateProgressView({ student, schoolId, onUpdate }: { student: Student; schoolId?: string; onUpdate?: () => void }) {
  const { t } = useTranslation();
  const enrolled = student.enrolledCourses || [];
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrollCourse, setUnenrollCourse] = useState<Pick<Course, 'id' | 'name'> | null>(null);

  useEffect(() => {
    if (schoolId && student.id) {
      const controller = new AbortController();
      setProgressLoading(true);
      studentService.getCourseProgress(schoolId, student.id)
        .then((res) => { if (!controller.signal.aborted) setCourseProgress(res.data || []); })
        .finally(() => { if (!controller.signal.aborted) setProgressLoading(false); });
      return () => controller.abort();
    }
  }, [schoolId, student.id]);

  const handleEnroll = async () => {
    if (!schoolId || !selectedCourse) return;
    setEnrolling(true);
    try {
      await courseService.enrollStudent(schoolId, selectedCourse.id, student.id);
      setEnrollDialog(false);
      setSelectedCourse(null);
      const res = await studentService.getCourseProgress(schoolId, student.id);
      setCourseProgress(res.data || []);
      onUpdate?.();
    } catch {} finally { setEnrolling(false); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{t('students.enrolledCourses', { count: enrolled.length })}</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={async () => {
          if (!schoolId) return;
          const res = await courseService.getAll(schoolId);
          setCourses(res.data || []);
          setEnrollDialog(true);
        }}>{t('students.enrollInCourse')}</Button>
      </Box>

      {progressLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
      ) : courseProgress.length === 0 ? (
        <Typography color="text.secondary">{t('students.notEnrolledCourse')}</Typography>
      ) : (
        courseProgress.map((course) => {
          const allLessons = [
            ...course.modules.flatMap((m: any) => m.lessons),
            ...course.ungroupedLessons,
          ];
          const completedCount = allLessons.filter((l: any) => l.status === 'completed').length;
          const absentCount = allLessons.filter((l: any) => l.status === 'absent').length;
          const notStartedCount = allLessons.filter((l: any) => l.status === 'not_started').length;
          const notEnrolledCount = allLessons.filter((l: any) => l.status === 'not_enrolled').length;
          const isExpanded = expandedCourseId === course.id;

          return (
            <Paper key={course.id} sx={{ mb: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <ListItem sx={{ cursor: 'pointer' }} onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {course.name}
                      {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </Box>
                  }
                  secondary={
                    <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                      <Chip label={t('students.lessonsCount', { count: allLessons.length })} size="small" />
                      <Chip label={t('students.completedCount', { count: completedCount })} size="small" color="success" variant="outlined" />
                      {absentCount > 0 && <Chip label={t('students.absentCount', { count: absentCount })} size="small" color="error" variant="outlined" />}
                      {notStartedCount > 0 && <Chip label={t('students.notStartedCount', { count: notStartedCount })} size="small" variant="outlined" />}
                      {notEnrolledCount > 0 && <Chip label={t('students.notEnrolledCount', { count: notEnrolledCount })} size="small" color="info" variant="outlined" />}
                      {course.totalSessions && <Chip label={t('students.sessionsCount', { count: course.totalSessions })} size="small" variant="outlined" />}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <IconButton edge="end" color="error" onClick={(e) => { e.stopPropagation(); setUnenrollCourse({ id: course.id, name: course.name }); }}><DeleteIcon /></IconButton>
              </ListItem>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Divider />
                {course.modules.map((mod: any) => (
                  <Box key={mod.id}>
                    <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.100' }}>
                      <Typography fontWeight={700} fontSize="0.9rem">{mod.title}</Typography>
                    </Box>
                    <LessonTable lessons={mod.lessons} />
                  </Box>
                ))}
                {course.ungroupedLessons.length > 0 && <LessonTable lessons={course.ungroupedLessons} />}
              </Collapse>
            </Paper>
          );
        })
      )}

      <Dialog open={enrollDialog} onClose={() => setEnrollDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('students.enrollInCourse')}</DialogTitle>
        <DialogContent>
          {!selectedCourse ? (
            <List>
              {courses.filter((c) => !enrolled.some((e) => e.id === c.id)).map((c) => {
                const method = courseMethod(t, c);
                return (
                  <Paper key={c.id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => setSelectedCourse(c)}>
                    <ListItem>
                      <ListItemText primary={c.name} secondary={
                        <Box display="flex" gap={1} mt={0.5}>
                          {method && (
                            <Chip label={t('students.priceChip', { price: method.price, unit: method.type === 'month' ? t('students.unitMonth') : method.type === 'session' ? t('students.unitSession') : t('students.unitCourse') })} size="small"
                              color={method.type === 'month' ? 'primary' : method.type === 'session' ? 'secondary' : 'warning'} />
                          )}
                        </Box>
                      } secondaryTypographyProps={{ component: 'div' }} />
                    </ListItem>
                  </Paper>
                );
              })}
              {courses.filter((c) => !enrolled.some((e) => e.id === c.id)).length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={2}>{t('students.noCoursesAvailable')}</Typography>
              )}
            </List>
          ) : (
            <Box>
              <Typography variant="h6" mb={1}>{selectedCourse.name}</Typography>
              {(() => {
                const method = courseMethod(t, selectedCourse);
                return (
                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    {method && (
                      <Chip label={t('students.paymentMethodLabel', { label: method.label, price: method.price, suffix: method.type === 'month' ? t('payments.perMonthSuffix') : method.type === 'session' ? t('payments.perSessionSuffix') : '' })}
                        size="small" color={method.type === 'month' ? 'primary' : method.type === 'session' ? 'secondary' : 'warning'} sx={{ alignSelf: 'flex-start' }} />
                    )}
                    {selectedCourse.startDate && (
                      <Chip label={t('students.startDateLabel', { date: new Date(selectedCourse.startDate).toLocaleDateString() })} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                    )}
                    {!!selectedCourse.numberOfSessions && (
                      <Chip label={t('students.sessionsLabel', { count: selectedCourse.numberOfSessions })} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                    )}
                  </Box>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCourse ? (
            <>
              <Button onClick={() => setSelectedCourse(null)}>{t('common.back')}</Button>
              <Button variant="contained" onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? t('students.enrolling') : t('students.enroll')}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEnrollDialog(false)}>{t('common.cancel')}</Button>
          )}
        </DialogActions>
      </Dialog>

      <UnenrollCourseDialog
        open={!!unenrollCourse}
        courseId={unenrollCourse?.id || ''}
        courseName={unenrollCourse?.name || ''}
        studentId={student.id}
        onClose={() => setUnenrollCourse(null)}
        onDone={() => { setUnenrollCourse(null); onUpdate?.(); }}
      />
    </Box>
  );
}

function KindergartenProgressView({ student, schoolId }: { student: Student; schoolId?: string }) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actsLoading, setActsLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      const controller = new AbortController();
      activityService.getAll(schoolId)
        .then((res) => { if (!controller.signal.aborted) setActivities(res.data || []); })
        .finally(() => { if (!controller.signal.aborted) setActsLoading(false); });
      return () => controller.abort();
    }
    setActsLoading(false);
  }, [schoolId]);

  const myParticipations = activities
    .map((a) => ({
      activity: a,
      participation: a.participations?.find((p) => p.studentId === student.id),
    }))
    .filter((x) => x.participation);

  if (actsLoading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" mb={2}>{t('students.activitiesCount', { count: myParticipations.length })}</Typography>
      {myParticipations.length === 0 ? (
        <Typography color="text.secondary">{t('students.noActivityYet')}</Typography>
      ) : (
        <Grid container spacing={2}>
          {myParticipations.map(({ activity: a, participation: p }) => (
            <Grid key={a.id} size={{ xs: 12, sm: 6 }}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={600}>{a.title}</Typography>
                  <Chip icon={p?.participated ? <CheckCircle /> : <Cancel />}
                    label={p?.participated ? t('students.participated') : t('attendance.absent')}
                    size="small" color={p?.participated ? 'success' : 'default'} />
                </Box>
                <Typography variant="caption" color="text.secondary">{a.date}{a.startTime ? ` ${a.startTime}` : ''}</Typography>
                {p?.rating && <Typography variant="body2">{t('students.rating', { rating: p.rating })}</Typography>}
                {p?.notes && <Typography variant="body2">{t('students.notes', { notes: p.notes })}</Typography>}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default function ProgressSection({ student, onUpdate }: { student: Student; onUpdate?: () => void }) {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { schoolType } = useSchool();

  if (schoolType === 'quranic') {
    return (
      <Box>
        <Typography variant="h6" mb={2}>{t('students.quranProgress')}</Typography>
        <QuranProgressView student={student} readOnly />
      </Box>
    );
  }

  if (schoolType === 'private') {
    return <PrivateProgressView student={student} schoolId={schoolId} onUpdate={onUpdate} />;
  }

  if (schoolType === 'kindergarten') {
    return <KindergartenProgressView student={student} schoolId={schoolId} />;
  }

  return null;
}
