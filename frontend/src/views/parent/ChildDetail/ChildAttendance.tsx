import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Chip, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import PageHeader from '../../../components/common/PageHeader';
import ChildDetailTabs from './components/ChildDetailTabs';
import DataTable, { type Column } from '../../../components/common/DataTable';
import attendanceService from '../../../services/attendanceService';
import courseAttendanceService from '../../../services/courseAttendanceService';
import aiService from '../../../services/aiService';
import { useSchool } from '../../../hooks/useSchool';
import type { Attendance, CourseStudentAttendanceGroup, DocumentScan } from '../../../types';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const periodLabel = (t: TFunction, p: string) => (p === 'morning' || p === 'afternoon' ? t(`activities.${p}`) : p);

export default function ChildAttendance() {
  const { t } = useTranslation();
  const { schoolId, childId } = useParams<{ schoolId: string; childId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [records, setRecords] = useState<Attendance[]>([]);
  const [courseGroups, setCourseGroups] = useState<CourseStudentAttendanceGroup[]>([]);
  const [courseTotalAbsences, setCourseTotalAbsences] = useState(0);
  const [courseJustified, setCourseJustified] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<DocumentScan[]>([]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (schoolId && childId) {
      setLoading(true);
      setError('');
      if (isPrivate) {
        courseAttendanceService.getByStudent(schoolId, childId)
          .then((res) => {
            if (!active) return;
            setCourseGroups(res.data?.courses || []);
            setCourseTotalAbsences(res.data?.summary?.absentDays || 0);
            setCourseJustified(res.data?.summary?.justifiedAbsences || 0);
          })
          .catch((e: any) => { if (active) setError(e?.response?.data?.message || t('parent.attendanceLoadFailed')); })
          .finally(() => { if (active) setLoading(false); });
      } else {
        attendanceService.getByStudent(schoolId, childId)
          .then((res) => { if (active) setRecords(res.data?.records || []); })
          .catch((e: any) => { if (active) setError(e?.response?.data?.message || t('parent.attendanceLoadFailed')); })
          .finally(() => { if (active) setLoading(false); });
      }
    }
    return () => { active = false; };
  }, [schoolId, childId, isPrivate, t]);

  const loadDocuments = async () => {
    if (!schoolId || !childId) return;
    try {
      const res = await aiService.listDocuments(schoolId);
      setDocuments((res.data || []).filter((d) => d.studentId === childId));
    } catch {
      // Documents are secondary to the attendance record itself.
    }
  };

  useEffect(() => { loadDocuments(); }, [schoolId, childId]);

  const handleUploadDocument = async () => {
    if (!schoolId || !childId || !docFile) return;
    setUploadingDoc(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('studentId', childId);
      formData.append('documentType', 'absence_justification');
      await aiService.scanDocument(schoolId, formData);
      setDocFile(null);
      await loadDocuments();
    } catch (e: any) {
      setError(e?.response?.data?.message || t('ai.loadFailed'));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleConfirmDocument = async (doc: DocumentScan) => {
    if (!schoolId) return;
    setConfirmingId(doc.id);
    try {
      await aiService.confirmDocument(schoolId, doc.id, {});
      await loadDocuments();
    } catch (e: any) {
      setError(e?.response?.data?.message || t('ai.loadFailed'));
    } finally {
      setConfirmingId(null);
    }
  };

  const totalAbsences = records.filter((r) => r.isAbsent).length;
  const justifiedAbsences = records.filter((r) => r.isAbsent && r.justified).length;

  const columns: Column<Attendance>[] = [
    { id: 'date', label: t('common.date'), accessor: (r) => new Date(r.date).toLocaleDateString() },
    { id: 'period', label: t('activities.period'), sortable: false, accessor: (r) => <Chip size="small" variant="outlined" label={periodLabel(t, r.period)} /> },
    { id: 'status', label: t('common.status'), accessor: (r) => <Chip label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} size="small" color={r.isAbsent ? 'error' : 'success'} /> },
    { id: 'justified', label: t('attendance.justified'), accessor: (r) => r.isAbsent ? (r.justified ? <Chip label={t('parent.yes')} size="small" color="success" /> : <Chip label={t('parent.no')} size="small" color="warning" />) : '-' },
    { id: 'reason', label: t('attendance.justification'), accessor: (r) => r.isAbsent && r.justified ? (r.justification || '-') : '-' },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>{t('common.back')}</Button>
      <ChildDetailTabs active="attendance" />
      <PageHeader title={isPrivate ? t('parent.attendanceByCourse') : t('titles.attendanceRecord')} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress size={30} /></Box>
      ) : isPrivate ? (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 6 }}><Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}><Typography variant="h4" fontWeight={700} color="error.main">{courseTotalAbsences}</Typography><Typography variant="body2" color="text.secondary">{t('attendance.totalAbsences')}</Typography></Paper></Grid>
            <Grid size={{ xs: 6 }}><Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}><Typography variant="h4" fontWeight={700} color="success.main">{courseJustified}</Typography><Typography variant="body2" color="text.secondary">{t('attendance.justified')}</Typography></Paper></Grid>
          </Grid>
          {courseGroups.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>{t('parent.noAttendanceRecordsYet')}</Typography>
          ) : (
            courseGroups.map((g) => (
              <Paper key={g.courseId} variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1.5}>
                  <Typography variant="h6">{g.courseName}</Typography>
                  <Box display="flex" gap={0.75} flexWrap="wrap">
                    <Chip size="small" label={t('parent.recordsLabel', { count: g.summary.totalDays })} variant="outlined" />
                    <Chip size="small" label={t('parent.absentLabel', { count: g.summary.absentDays })} color="error" />
                    <Chip size="small" label={t('parent.justifiedLabel', { count: g.summary.justifiedAbsences })} color="success" />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {t('parent.absenceOtherCoursesNote')}
                </Typography>
                {g.records.length === 0 ? (
                  <Typography color="text.secondary" py={2}>{t('parent.noRecords')}</Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('common.date')}</TableCell>
                          <TableCell>{t('common.status')}</TableCell>
                          <TableCell>{t('attendance.justified')}</TableCell>
                          <TableCell>{t('attendance.justification')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {g.records.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                            <TableCell><Chip size="small" label={r.isAbsent ? t('attendance.absent') : t('attendance.present')} color={r.isAbsent ? 'error' : 'success'} /></TableCell>
                            <TableCell>{r.isAbsent ? (r.justified ? <Chip size="small" label={t('parent.yes')} color="success" /> : <Chip size="small" label={t('parent.no')} color="warning" />) : '-'}</TableCell>
                            <TableCell>{r.isAbsent && r.justified ? (r.justification || '-') : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            ))
          )}
        </>
      ) : (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 6 }}><Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}><Typography variant="h4" fontWeight={700} color="error.main">{totalAbsences}</Typography><Typography variant="body2" color="text.secondary">{t('attendance.totalAbsences')}</Typography></Paper></Grid>
            <Grid size={{ xs: 6 }}><Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}><Typography variant="h4" fontWeight={700} color="success.main">{justifiedAbsences}</Typography><Typography variant="body2" color="text.secondary">{t('attendance.justified')}</Typography></Paper></Grid>
          </Grid>
          <DataTable columns={columns} data={records} keyExtractor={(r) => r.id} loading={false} searchable={false} />
        </>
      )}

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={1}>{t('ai.documents.documentsForChild')}</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>{t('ai.documents.humanReviewRequired')}</Alert>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
          <Button variant="outlined" component="label">
            {t('ai.documents.selectFile')}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp,.pdf" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
          </Button>
          {docFile && <Typography variant="body2">{docFile.name}</Typography>}
          <Button variant="contained" disabled={!docFile || uploadingDoc} onClick={handleUploadDocument}>
            {uploadingDoc ? t('ai.documents.uploading') : t('ai.documents.uploadForChild')}
          </Button>
        </Box>
        <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('ai.documents.myDocuments')}</Typography>
        {documents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">{t('ai.documents.noDocumentsForChild')}</Typography>
        ) : documents.map((doc) => (
          <Box key={doc.id} display="flex" gap={1} alignItems="center" flexWrap="wrap" py={1} borderBottom="1px solid" borderColor="divider">
            <Typography variant="body2" fontWeight={600}>{doc.originalName}</Typography>
            <Chip size="small" label={t(`ai.docTypes.${doc.documentType}`)} variant="outlined" />
            <Chip
              size="small"
              color={doc.reviewStatus === 'approved' ? 'success' : doc.reviewStatus === 'rejected' ? 'error' : doc.reviewStatus === 'confirmed' ? 'info' : 'warning'}
              label={t(`ai.documents.review.${doc.reviewStatus}`)}
            />
            {doc.extractedFields?.startDate && (
              <Typography variant="caption" color="text.secondary">
                {`${doc.extractedFields.startDate}${doc.extractedFields.endDate ? ` → ${doc.extractedFields.endDate}` : ''}`}
              </Typography>
            )}
            {doc.reviewStatus === 'pending_review' && doc.status === 'completed' && (
              <Button size="small" variant="outlined" disabled={confirmingId === doc.id} onClick={() => handleConfirmDocument(doc)}>
                {t('ai.documents.confirmExtracted')}
              </Button>
            )}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
