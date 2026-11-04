import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Chip, Button, CircularProgress, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Divider, TablePagination,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import AttendanceIcon from '@mui/icons-material/HowToReg';
import JustifyIcon from '@mui/icons-material/FactCheck';
import ViewIcon from '@mui/icons-material/Visibility';
import GlassSurface from '../../../../components/common/GlassSurface';
import SegmentedControl from '../../../../components/common/SegmentedControl';
import FilterRow from '../../../../components/common/FilterBar';
import { pillFieldSx } from '../../../../components/common/filterStyles';
import { useTranslation } from 'react-i18next';
import lessonService from '../../../../services/lessonService';
import courseSessionService from '../../../../services/courseSessionService';
import courseAttendanceService from '../../../../services/courseAttendanceService';
import type { CourseSession, CourseAttendance, CourseSessionAttendanceView, Lesson } from '../../../../types';

export default function CourseProgressTabs({ schoolId, courseId }: { schoolId: string; courseId: string }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);

  const [records, setRecords] = useState<CourseAttendance[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordDate, setRecordDate] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [recordFilter, setRecordFilter] = useState<'all' | 'absent'>('all');
  const [summary, setSummary] = useState<{ absentCount: number; justifiedAbsences: number; attendanceRate: number; totalRecords: number } | null>(null);

  const [viewSession, setViewSession] = useState<CourseSessionAttendanceView | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [justifyTarget, setJustifyTarget] = useState<CourseAttendance | null>(null);
  const [justifyText, setJustifyText] = useState('');
  const [justifySaving, setJustifySaving] = useState(false);
  const [justifyError, setJustifyError] = useState('');

  const fetchLessonsSessions = useCallback(async () => {
    try {
      const [lRes, sRes] = await Promise.all([
        lessonService.getAll(schoolId, courseId),
        courseSessionService.getSessions(schoolId, courseId),
      ]);
      setLessons(lRes.data || []);
      setSessions(sRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('courses.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, courseId]);

  useEffect(() => { fetchLessonsSessions(); }, [fetchLessonsSessions]);

  const fetchRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const filters: Record<string, string | undefined> = { date: recordDate || undefined, search: recordSearch || undefined };
      if (recordFilter === 'absent') filters.isAbsent = 'true';
      const [listRes, summRes] = await Promise.all([
        courseAttendanceService.getByCourse(schoolId, courseId, filters, recordsPage + 1, 50),
        courseAttendanceService.getSummary(schoolId, courseId, { date: recordDate || undefined }),
      ]);
      setRecords(listRes.data || []);
      setRecordsTotal(listRes.pagination?.total || 0);
      setSummary(summRes.data || null);
    } catch {
      setRecords([]);
      setSummary(null);
    } finally {
      setRecordsLoading(false);
    }
  }, [schoolId, courseId, recordDate, recordSearch, recordFilter, recordsPage]);

  useEffect(() => {
    if (tab === 1) fetchRecords();
  }, [tab, fetchRecords]);

  const openView = async (s: CourseSession) => {
    setViewLoading(true);
    setViewSession(null);
    try {
      const res = await courseAttendanceService.getBySession(schoolId, courseId, s.sessionNumber);
      setViewSession(res.data);
    } catch {
      setViewSession(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleJustify = async () => {
    if (!justifyTarget) return;
    setJustifySaving(true);
    setJustifyError('');
    try {
      await courseAttendanceService.justify(schoolId, courseId, justifyTarget.id, justifyText.trim());
      setJustifyTarget(null);
      setJustifyText('');
      await fetchRecords();
    } catch (err: any) {
      setJustifyError(err?.response?.data?.message || t('courses.failedJustify'));
    } finally {
      setJustifySaving(false);
    }
  };

  const grouped = lessons.reduce<Record<string, { title: string; lessons: Lesson[] }>>((acc, l) => {
    const key = (l as any).programModule?.id || 'none';
    if (!acc[key]) acc[key] = { title: (l as any).programModule?.title || t('courses.ungroupedLessons'), lessons: [] };
    acc[key].lessons.push(l);
    return acc;
  }, {});
  const groupOrder = [...new Set(lessons.map((l) => (l as any).programModule?.id || 'none'))];

  const sectionAnim = {
    animation: 'fadeInUp 350ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" py={5}><CircularProgress size={30} /></Box>;
  }
  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 3, mt: 3 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <GlassSurface sx={{ borderRadius: 4, mb: 2.5, ...sectionAnim }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={t('courses.lessonsAndSessions')} />
          <Tab label={t('courses.attendanceRecord')} />
        </Tabs>
      </GlassSurface>

      {tab === 0 && (
        <Box display="flex" flexDirection="column" gap={2.5}>
          <GlassSurface sx={{ p: 2.5, borderRadius: 4, ...sectionAnim }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
                <BookIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight={700}>{t('courses.teacherLessons')}</Typography>
            </Box>
            {groupOrder.length === 0 ? (
              <Typography color="text.secondary" py={1}>{t('courses.noLessonsYet')}</Typography>
            ) : (
              groupOrder.map((key) => (
                <Box key={key} mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={0.75}>{grouped[key].title}</Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.75}>
                    {grouped[key].lessons.map((l) => (
                      <Chip key={l.id} label={l.title} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              ))
            )}
          </GlassSurface>

          <GlassSurface sx={{ p: 2.5, borderRadius: 4, ...sectionAnim }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
                <AttendanceIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight={700}>{t('courses.completedSessions')}</Typography>
            </Box>
            {sessions.length === 0 ? (
              <Typography color="text.secondary" py={1}>{t('courses.noCompletedSession')}</Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={0.5}>
                {sessions.map((s, i) => (
                  <Box key={s.id}>
                    {i > 0 && <Divider sx={{ my: 0.5 }} />}
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      justifyContent="space-between"
                      sx={{
                        px: 0, py: 1,
                        transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                        '&:hover': { bgcolor: 'action.hover', borderRadius: 2 },
                      }}
                    >
                      <Box width="100%">
                        <Box display="flex" alignItems="center" gap={1.5} mb={0.5} flexWrap="wrap">
                          <Typography fontWeight={700}>{t('courses.sessionNumber', { number: s.sessionNumber })}</Typography>
                          {s.completed ? (
                            <Chip size="small" label={t('courses.completedOn', { date: s.completedAt || '' })} color="success" />
                          ) : (
                            <Chip size="small" label={t('courses.incomplete')} color="default" />
                          )}
                        </Box>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {s.lessons.length > 0 ? s.lessons.map((l) => (
                            <Chip key={l.id} label={l.title} size="small" variant="outlined" color="primary" />
                          )) : (
                            <Typography variant="caption" color="text.secondary">{t('courses.noLessons')}</Typography>
                          )}
                        </Box>
                      </Box>
                      {s.completed && (
                        <Button size="small" startIcon={<ViewIcon />} onClick={() => openView(s)} sx={{ flexShrink: 0, ml: 1, mt: 0.5 }}>
                          {t('courses.viewAttendance')}
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </GlassSurface>
        </Box>
      )}

      {tab === 1 && (
        <GlassSurface sx={{ p: 2.5, borderRadius: 4, ...sectionAnim }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', color: 'primary.main' }}>
              <AttendanceIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight={700}>{t('courses.attendanceRecord')}</Typography>
          </Box>
          {summary && (
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              <Chip size="small" label={t('students.recordsChip', { count: summary.totalRecords })} variant="outlined" />
              <Chip size="small" label={t('students.absentChip', { count: summary.absentCount })} color="error" />
              <Chip size="small" label={t('students.justifiedChip', { count: summary.justifiedAbsences })} color="success" />
              <Chip size="small" label={t('courses.attendanceRateChip', { rate: summary.attendanceRate })} color="primary" />
            </Box>
          )}
          <FilterRow sx={{ mb: 2 }}>
            <TextField
              label={t('common.date')}
              type="date"
              size="small"
              value={recordDate}
              onChange={(e) => { setRecordDate(e.target.value); setRecordsPage(0); }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 160, ...pillFieldSx }}
            />
            <TextField
              label={t('courses.searchByName')}
              size="small"
              value={recordSearch}
              onChange={(e) => { setRecordSearch(e.target.value); setRecordsPage(0); }}
              sx={{ minWidth: 180, ...pillFieldSx }}
            />
            <SegmentedControl
              value={recordFilter}
              onChange={(v) => { setRecordFilter(v); setRecordsPage(0); }}
              options={[
                { value: 'all' as const, label: t('common.all') },
                { value: 'absent' as const, label: t('courses.absentOnly') },
              ]}
            />
          </FilterRow>
          {recordsLoading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
          ) : records.length === 0 ? (
            <Typography color="text.secondary" py={3} textAlign="center">{t('courses.noMatchingAttendance')}</Typography>
          ) : (
            <>
              <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('students.student')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('common.date')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('common.status')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('courses.justifiedHeader')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('attendance.justification')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{t('students.action')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id} hover sx={{ transition: 'background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <TableCell>
                          <Typography fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.student?.registrationNumber}</Typography>
                        </TableCell>
                        <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} color={r.isAbsent ? 'error' : 'success'} />
                        </TableCell>
                        <TableCell>
                          {r.isAbsent
                            ? (r.justified ? <Chip size="small" label={t('attendance.justified')} color="success" /> : <Chip size="small" label={t('attendance.unjustified')} color="warning" />)
                            : '-'}
                        </TableCell>
                        <TableCell>{r.isAbsent && r.justified ? (r.justification || '-') : '-'}</TableCell>
                        <TableCell>
                          {r.isAbsent && !r.justified ? (
                            <Button size="small" startIcon={<JustifyIcon />} onClick={() => { setJustifyTarget(r); setJustifyText(''); }}>
                              {t('attendance.justify')}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {recordsTotal > 50 && (
                <TablePagination
                  component="div"
                  dir="ltr"
                  count={recordsTotal}
                  page={recordsPage}
                  rowsPerPage={50}
                  rowsPerPageOptions={[50]}
                  onPageChange={(_, p) => setRecordsPage(p)}
                />
              )}
            </>
          )}
        </GlassSurface>
      )}

      <Dialog open={!!viewSession} onClose={() => setViewSession(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('courses.sessionAttendance', { number: viewSession?.sessionNumber })}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {viewLoading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
          ) : viewSession ? (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Typography variant="body2" color="text.secondary">
                {t('courses.dateLabel', { date: viewSession.date ? new Date(viewSession.date).toLocaleDateString() : '-' })}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {viewSession.lessons.map((l) => (
                  <Chip key={l.id} label={l.title} size="small" variant="outlined" color="primary" />
                ))}
              </Box>
              {viewSession.attendance.length === 0 ? (
                <Typography color="text.secondary" py={2} textAlign="center">{t('courses.noSessionAttendance')}</Typography>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {viewSession.attendance.map((r) => (
                    <Box key={r.id} display="flex" alignItems="center" justifyContent="space-between" gap={1}
                      sx={{ px: 1.5, py: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                      <Typography fontWeight={600}>{r.student?.firstName} {r.student?.lastName}</Typography>
                      <Chip size="small" label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} color={r.isAbsent ? 'error' : 'success'} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{t('courses.failedSessionAttendance')}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewSession(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!justifyTarget} onClose={() => setJustifyTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('courses.justifyAbsenceTitle')}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" fontWeight={600}>
              {t('courses.studentLabel', { name: `${justifyTarget?.student?.firstName} ${justifyTarget?.student?.lastName}` })}
            </Typography>
            <TextField label={t('courses.absenceReason')} multiline rows={3} value={justifyText} onChange={(e) => setJustifyText(e.target.value)} />
            {justifyError && <Alert severity="error" sx={{ borderRadius: 2 }}>{justifyError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setJustifyTarget(null)} disabled={justifySaving}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleJustify} disabled={justifySaving || !justifyText.trim()} sx={{ borderRadius: 999 }}>
            {justifySaving ? t('common.saving') : t('courses.confirmJustification')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
