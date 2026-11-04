import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Divider } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useSchool } from '../../../hooks/useSchool';
import parentService from '../../../services/parentService';
import activityService from '../../../services/activityService';
import QuranProgressView from '../../shared/QuranProgressView';
import ChildDetailTabs from './components/ChildDetailTabs';
import ParentAiSummaryCard from '../../../components/ai/ParentAiSummaryCard';
import type { Student, StudentActivityProgress, ActivityPeriod, ActivityCategory } from '../../../types';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const categoryLabel = (t: TFunction, c: ActivityCategory) => t(`activities.${c}`);
const periodLabel = (t: TFunction, p: ActivityPeriod) => t(`activities.${p}`);

export default function ChildProgress() {
  const { t } = useTranslation();
  const { schoolId, childId } = useParams<{ schoolId: string; childId: string }>();
  const { schoolType } = useSchool();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [activities, setActivities] = useState<StudentActivityProgress[] | null>(null);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && childId) {
      setLoading(true);
      if (schoolType === 'quranic') {
        parentService.getChildProgress(schoolId, childId)
          .then((res) => setStudent(res.data?.student || null))
          .finally(() => setLoading(false));
      } else {
        parentService.getChildProgress(schoolId, childId)
          .then((res) => {
            setStudent(res.data?.student || null);
            setCourseProgress(res.data?.courseProgress || []);
          });
        if (schoolType === 'kindergarten') {
          activityService.getStudentProgress(schoolId, childId)
            .then((res) => setActivities(res.data?.records || []))
            .finally(() => setLoading(false));
        } else { setLoading(false); }
      }
    }
  }, [schoolId, childId, schoolType]);

  if (!student) return null;

  const back = (
    <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>{t('common.back')}</Button>
  );

  const tabs = <ChildDetailTabs active="progress" />;

  const aiSummary = schoolId && childId ? <ParentAiSummaryCard schoolId={schoolId} studentId={childId} /> : null;

  if (schoolType === 'quranic') {
    return (
      <Box>
        {back}
        {tabs}
        {aiSummary}
        <Typography variant="h5" fontWeight={700} mb={3}>{t('parent.quranProgressTitle', { name: `${student.firstName} ${student.lastName}` })}</Typography>
        <QuranProgressView student={student} readOnly />
      </Box>
    );
  }

  if (schoolType === 'kindergarten') {
    const total = activities?.length || 0;
    const completed = activities?.filter((r) => r.status === 'completed' && r.participated).length || 0;
    const missed = activities?.filter((r) => r.status === 'completed' && !r.participated).length || 0;
    const planned = activities?.filter((r) => r.status === 'planned').length || 0;

    return (
      <Box>
        {back}
        {tabs}
        {aiSummary}
        <Typography variant="h5" fontWeight={700} mb={3}>{t('parent.activitiesProgressTitle', { name: `${student.firstName} ${student.lastName}` })}</Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : total === 0 ? (
          <Typography color="text.secondary">{t('parent.noActivitiesRecorded')}</Typography>
        ) : (
          <>
            <Grid container spacing={3} mb={3}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h3" fontWeight={800} color="primary.main">{total}</Typography>
                  <Typography color="text.secondary">{t('activities.activitiesCount')}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h3" fontWeight={800} color="success.main">{completed}</Typography>
                  <Typography color="text.secondary">{t('activities.attendedActivities')}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h3" fontWeight={800} color="error.main">{missed}</Typography>
                  <Typography color="text.secondary">{t('activities.missedActivities')}</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h3" fontWeight={800} color="text.secondary">{planned}</Typography>
                  <Typography color="text.secondary">{t('activities.notCompletedYet')}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('parent.activity')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('common.type')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('common.description')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('common.date')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('activities.period')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((r) => (
                    <TableRow key={r.activity.id}>
                      <TableCell><Typography fontWeight={600}>{r.activity.title}</Typography></TableCell>
                      <TableCell>{categoryLabel(t, r.activity.category) || r.activity.category}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        {r.activity.description || <Typography color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>{r.activity.date}</TableCell>
                      <TableCell>{periodLabel(t, r.activity.period)}</TableCell>
                      <TableCell>
                        {r.status === 'planned' ? (
                          <Chip size="small" variant="outlined" label={t('activities.notDoneYet')} />
                        ) : (
                          <Chip size="small" label={r.participated ? t('activities.attendedIt') : t('activities.missedIt')} color={r.participated ? 'success' : 'error'} variant={r.participated ? 'filled' : 'outlined'} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    );
  }

  const STATUS_MAP: Record<string, { label: string; color: 'success' | 'error' | 'default' | 'warning' | 'info' }> = {
    completed: { label: t('parent.statusCompleted'), color: 'success' },
    absent: { label: t('parent.statusAbsent'), color: 'error' },
    not_started: { label: t('parent.statusNotReached'), color: 'default' },
    not_enrolled: { label: t('parent.statusNotEnrolled'), color: 'info' },
  };

  return (
    <Box>
      {back}
      {tabs}
      {aiSummary}
      <Typography variant="h5" fontWeight={700} mb={3}>{t('parent.coursesProgressTitle', { name: `${student.firstName} ${student.lastName}` })}</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : courseProgress.length === 0 ? (
        <Typography color="text.secondary">{t('parent.notEnrolledInCourse')}</Typography>
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

          return (
            <Paper key={course.id} sx={{ mb: 3, borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" fontWeight={700}>{course.name}</Typography>
                {course.totalSessions && (
                  <Typography variant="body2" color="text.secondary">{t('parent.totalSessionsLabel', { count: course.totalSessions })}</Typography>
                )}
                <Grid container spacing={2} mt={1}>
                  <Grid>
                    <Chip label={t('parent.lessonsCount', { count: allLessons.length })} size="small" />
                  </Grid>
                  <Grid>
                    <Chip label={t('parent.completedCount', { count: completedCount })} size="small" color="success" variant="outlined" />
                  </Grid>
                  <Grid>
                    <Chip label={t('parent.absentCount', { count: absentCount })} size="small" color="error" variant="outlined" />
                  </Grid>
                  <Grid>
                    <Chip label={t('parent.notReachedCount', { count: notStartedCount })} size="small" variant="outlined" />
                  </Grid>
                  {notEnrolledCount > 0 && (
                    <Grid>
                      <Chip label={t('parent.notEnrolledCount', { count: notEnrolledCount })} size="small" color="info" variant="outlined" />
                    </Grid>
                  )}
                </Grid>
              </Box>

              {course.modules.map((mod: any) => (
                <Box key={mod.id}>
                  <Divider />
                  <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.100' }}>
                    <Typography fontWeight={700} fontSize="0.9rem">{mod.title}</Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>{t('parent.lesson')}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t('parent.completionDate')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mod.lessons.map((lesson: any) => {
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
                </Box>
              ))}

              {course.ungroupedLessons.length > 0 && (
                <Box>
                  <Divider />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>{t('parent.lesson')}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t('common.status')}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{t('parent.completionDate')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {course.ungroupedLessons.map((lesson: any) => {
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
                </Box>
              )}
            </Paper>
          );
        })
      )}
    </Box>
  );
}
