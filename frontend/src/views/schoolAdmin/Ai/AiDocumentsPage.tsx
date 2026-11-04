import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  LinearProgress, Table, TableBody, TableCell, TableRow, TextField, Typography,
} from '@mui/material';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Download from '@mui/icons-material/Download';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Visibility from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import GlassCard from '../../../components/common/GlassCard';
import DataTable, { type Column } from '../../../components/common/DataTable';
import { formatRatioPercent, getErrorMessage } from '../../../components/ai/aiUtils';
import aiService from '../../../services/aiService';
import type { DocumentRevision, DocumentReviewStatus, DocumentScan, DocumentScanStatus } from '../../../types';

const REVIEW_COLOR: Record<DocumentReviewStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending_review: 'warning',
  confirmed: 'info',
  approved: 'success',
  rejected: 'error',
  archived: 'default',
  expired: 'default',
};

const STATUS_COLOR: Record<DocumentScanStatus, 'warning' | 'success' | 'error'> = {
  processing: 'warning',
  completed: 'success',
  failed: 'error',
};

const FIELD_KEYS = ['title', 'studentName', 'firstName', 'lastName', 'dateOfBirth', 'ageYears', 'issueDate', 'startDate', 'endDate', 'reason', 'issuer', 'summary'];
const DATE_FIELD_KEYS = new Set(['dateOfBirth', 'issueDate', 'startDate', 'endDate']);

function fieldsFormFrom(doc: DocumentScan): Record<string, string> {
  const form: Record<string, string> = {};
  for (const key of FIELD_KEYS) {
    const value = doc.extractedFields?.[key];
    form[key] = typeof value === 'string' ? value : '';
  }
  return form;
}

function formatFieldValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export default function AiDocumentsPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [documents, setDocuments] = useState<DocumentScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [selected, setSelected] = useState<DocumentScan | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewStartDate, setReviewStartDate] = useState('');
  const [reviewEndDate, setReviewEndDate] = useState('');
  const [history, setHistory] = useState<DocumentRevision[]>([]);
  const [fieldsForm, setFieldsForm] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ docId: string; url: string; mimeType: string } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const clearPreview = useCallback(() => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  useEffect(() => () => { clearPreview(); }, [clearPreview]);

  const handlePreview = async (doc: DocumentScan) => {
    if (!schoolId) return;
    clearPreview();
    setPreviewLoadingId(doc.id);
    setError('');
    try {
      const result = await aiService.getDocumentPreview(schoolId, doc.id);
      setPreview({ docId: doc.id, url: result.url, mimeType: result.mimeType || doc.mimeType });
    } catch (err) {
      setError(getErrorMessage(err, t('ai.documents.previewFailed')));
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const closeDialog = () => {
    clearPreview();
    setSelected(null);
  };

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await aiService.listDocuments(schoolId);
      setDocuments(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [schoolId, t]);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!schoolId || !file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await aiService.scanDocument(schoolId, formData, (event) => {
        if (event.total) setProgress(Math.round((event.loaded / event.total) * 100));
      });
      setFile(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const handleArchive = async () => {
    if (!schoolId || !selected) return;
    setReviewing(true);
    setError('');
    try {
      const res = await aiService.archiveDocument(schoolId, selected.id);
      if (res.data) setSelected(res.data);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setReviewing(false);
    }
  };

  const handleView = async (doc: DocumentScan) => {
    clearPreview();
    setSelected(doc);
    setFieldsForm(fieldsFormFrom(doc));
    setHistory([]);
    if (schoolId) {
      aiService.getDocumentHistory(schoolId, doc.id).then((res) => setHistory(res.data || [])).catch(() => {});
    }
    setReviewStartDate(typeof doc.extractedFields?.startDate === 'string' ? doc.extractedFields.startDate : '');
    setReviewEndDate(typeof doc.extractedFields?.endDate === 'string' ? doc.extractedFields.endDate : '');
    if (!schoolId) return;
    try {
      const res = await aiService.getDocument(schoolId, doc.id);
      if (res.data) {
        setSelected(res.data);
        setFieldsForm(fieldsFormFrom(res.data));
        setReviewStartDate(typeof res.data.extractedFields?.startDate === 'string' ? res.data.extractedFields.startDate : '');
        setReviewEndDate(typeof res.data.extractedFields?.endDate === 'string' ? res.data.extractedFields.endDate : '');
      }
    } catch {
      // Keep the row data already shown in the dialog.
    }
  };

  const handleDownload = async (doc: DocumentScan) => {
    if (!schoolId) return;
    setDownloadingId(doc.id);
    setError('');
    try {
      await aiService.downloadDocument(schoolId, doc.id, doc.originalName);
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirm = async () => {
    if (!schoolId || !selected) return;
    setReviewing(true);
    setError('');
    try {
      const res = await aiService.confirmDocument(schoolId, selected.id, {
        extractedFields: Object.fromEntries(Object.entries(fieldsForm).map(([k, v]) => [k, v.trim()])),
      });
      if (res.data) {
        setSelected(res.data);
        setFieldsForm(fieldsFormFrom(res.data));
      }
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setReviewing(false);
    }
  };

  const handleReview = async (decision: 'approved' | 'rejected') => {
    if (!schoolId || !selected) return;
    setReviewing(true);
    setError('');
    try {
      const res = await aiService.reviewDocument(schoolId, selected.id, {
        decision,
        note: reviewNote.trim() || undefined,
        startDate: decision === 'approved' ? reviewStartDate || undefined : undefined,
        endDate: decision === 'approved' ? reviewEndDate || undefined : undefined,
      });
      if (res.data) setSelected(res.data);
      setReviewNote('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setReviewing(false);
    }
  };

  const verificationWarnings = (doc: DocumentScan): string[] => {
    const warnings: string[] = [];
    const checks = doc.verification?.checks || [];
    if (doc.verification?.studentNameMatches === false || checks.includes('student_name_mismatch')) warnings.push(t('ai.documents.nameMismatch'));
    if (doc.verification?.firstNameMatches === false || checks.includes('first_name_mismatch')) warnings.push(t('ai.documents.firstNameMismatch'));
    if (doc.verification?.lastNameMatches === false || checks.includes('last_name_mismatch')) warnings.push(t('ai.documents.lastNameMismatch'));
    if (doc.verification?.dateOfBirthMatches === false || checks.includes('date_of_birth_mismatch')) warnings.push(t('ai.documents.dobMismatch'));
    if (checks.includes('date_of_birth_missing')) warnings.push(t('ai.documents.dobMissing'));
    if (checks.includes('student_date_of_birth_missing')) warnings.push(t('ai.documents.studentDobMissing'));
    if (doc.verification?.ageMatches === false || checks.includes('age_mismatch')) warnings.push(t('ai.documents.ageMismatch'));
    if (doc.verification?.issueDateValid === false || checks.includes('issue_date_missing_or_invalid')) warnings.push(t('ai.documents.issueDateInvalid'));
    if (checks.includes('dates_missing_or_invalid')) warnings.push(t('ai.documents.datesInvalid'));
    if (doc.verification?.lowConfidence || checks.includes('low_confidence')) warnings.push(t('ai.documents.lowConfidence'));
    if (doc.verification?.extractionSkipped) warnings.push(t('ai.documents.manualEntryRequired'));
    return [...new Set(warnings)];
  };

  const matchChip = (label: string, value: boolean | null | undefined) => (
    <Chip
      size="small"
      variant="filled"
      color={value === true ? 'success' : value === false ? 'error' : 'default'}
      label={`${label}: ${value === true ? t('ai.documents.matches') : value === false ? t('ai.documents.mismatchLabel') : t('ai.documents.notAvailable')}`}
    />
  );

  const columns: Column<DocumentScan>[] = [
    { id: 'originalName', label: t('ai.documents.fileName'), sortable: false, accessor: (d) => <Typography variant="body2" fontWeight={600}>{d.originalName}</Typography> },
    {
      id: 'documentType', label: t('ai.documents.documentType'), sortable: false,
      accessor: (d) => <Chip size="small" variant="outlined" label={t(`ai.docTypes.${d.documentType}`)} />,
    },
    {
      id: 'status', label: t('ai.documents.status'), sortable: false,
      accessor: (d) => <Chip size="small" variant="filled" color={STATUS_COLOR[d.status]} label={t(`ai.docStatus.${d.status}`)} />,
    },
    {
      id: 'reviewStatus', label: t('ai.documents.reviewStatus'), sortable: false,
      accessor: (d) => <Chip size="small" variant="filled" color={REVIEW_COLOR[d.reviewStatus]} label={t(`ai.documents.review.${d.reviewStatus}`)} />,
    },
    { id: 'confidence', label: t('ai.confidence'), sortable: false, accessor: (d) => formatRatioPercent(d.confidence) },
    { id: 'createdAt', label: t('common.date'), sortable: false, accessor: (d) => new Date(d.createdAt).toLocaleDateString() },
    {
      id: 'actions', label: t('common.actions'), sortable: false,
      accessor: (d) => (
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={() => handleView(d)}>
            {t('ai.documents.view')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<OpenInNew />} disabled={previewLoadingId === d.id} onClick={() => { handleView(d); void handlePreview(d); }}>
            {previewLoadingId === d.id ? t('ai.documents.previewLoading') : t('ai.documents.openInPage')}
          </Button>
          <Button size="small" variant="text" startIcon={<Download />} disabled={downloadingId === d.id} onClick={() => handleDownload(d)}>
            {t('ai.documents.download')}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title={t('ai.documents.title')} subtitle={t('ai.documents.subtitle')} />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <GlassCard sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>{t('ai.documents.upload')}</Typography>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
            {t('ai.documents.selectFile')}
            <input hidden type="file" accept="image/*,.pdf" onChange={handleFileChange} />
          </Button>
          {file && <Typography variant="body2">{file.name}</Typography>}
          <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? t('ai.documents.uploading') : t('ai.documents.scan')}
          </Button>
          <Button
            variant="text"
            onClick={async () => {
              if (!schoolId) return;
              await aiService.expireStaleDocuments(schoolId).catch(() => {});
              await load();
            }}
          >
            {t('ai.documents.expireStale')}
          </Button>
        </Box>
        {uploading && (
          <LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress ?? undefined} sx={{ mt: 2, borderRadius: 1 }} />
        )}
      </GlassCard>

      <DataTable
        columns={columns}
        data={documents}
        keyExtractor={(d) => d.id}
        loading={loading}
        searchable={false}
        emptyMessage={t('ai.documents.noDocuments')}
      />

      <Dialog open={!!selected} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.originalName}</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                <Chip size="small" variant="outlined" label={t(`ai.docTypes.${selected.documentType}`)} />
                <Chip size="small" variant="filled" color={STATUS_COLOR[selected.status]} label={t(`ai.docStatus.${selected.status}`)} />
                <Chip size="small" variant="outlined" label={`${t('ai.confidence')}: ${formatRatioPercent(selected.confidence)}`} />
              </Box>
              {selected.error && <Alert severity="error" sx={{ mb: 2 }}>{selected.error}</Alert>}
              <Alert severity="info" sx={{ mb: 2 }}>{t('ai.documents.humanReviewRequired')}</Alert>
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                <Chip size="small" variant="filled" color={REVIEW_COLOR[selected.reviewStatus]} label={`${t('ai.documents.reviewStatus')}: ${t(`ai.documents.review.${selected.reviewStatus}`)}`} />
                {((selected.appliedAttendanceIds?.length || 0) + (selected.appliedCourseAttendanceIds?.length || 0)) > 0 && (
                  <Chip size="small" variant="outlined" color="success" label={`${t('ai.documents.appliedAbsences')}: ${(selected.appliedAttendanceIds?.length || 0) + (selected.appliedCourseAttendanceIds?.length || 0)}`} />
                )}
              </Box>
              {verificationWarnings(selected).length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.verificationWarnings')}</Typography>
                  {verificationWarnings(selected).map((warning) => (
                    <Alert key={warning} severity="warning" sx={{ mb: 1 }}>{warning}</Alert>
                  ))}
                </Box>
              )}

              {selected.verification && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.studentVerification')}</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                    {matchChip(t('ai.documents.nameMatch'), selected.verification.studentNameMatches)}
                    {matchChip(t('ai.documents.dobMatch'), selected.verification.dateOfBirthMatches)}
                    {matchChip(t('ai.documents.ageMatchLabel'), selected.verification.ageMatches)}
                    {matchChip(t('ai.documents.fields.issueDate'), selected.verification.issueDateValid)}
                  </Box>
                  {(selected.verification.documentAgeYears != null || selected.verification.studentAgeYears != null) && (
                    <Typography variant="body2" color="text.secondary">
                      {`${t('ai.documents.documentAge')}: ${selected.verification.documentAgeYears ?? '—'} · ${t('ai.documents.studentAge')}: ${selected.verification.studentAgeYears ?? '—'}`}
                    </Typography>
                  )}
                </Box>
              )}

              {previewLoadingId === selected.id && (
                <Typography variant="body2" color="text.secondary" mb={2}>{t('ai.documents.previewLoading')}</Typography>
              )}
              {preview && preview.docId === selected.id && (
                <Box mb={2}>
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Button size="small" onClick={clearPreview}>{t('ai.documents.closePreview')}</Button>
                  </Box>
                  {preview.mimeType === 'application/pdf' ? (
                    <Box component="iframe" title={selected.originalName} src={preview.url} sx={{ width: '100%', height: 600, border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />
                  ) : preview.mimeType.startsWith('image/') ? (
                    <Box component="img" alt={selected.originalName} src={preview.url} sx={{ maxWidth: '100%', maxHeight: 600, display: 'block', mx: 'auto', borderRadius: 2 }} />
                  ) : (
                    <Alert severity="info">{t('ai.documents.previewUnsupported')}</Alert>
                  )}
                </Box>
              )}

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.extractedFields')}</Typography>
              {selected.extractedFields && Object.keys(selected.extractedFields).length > 0 ? (
                <Table size="small" sx={{ mb: 2 }}>
                  <TableBody>
                    {Object.entries(selected.extractedFields).filter(([key]) => key !== 'summary').map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell sx={{ fontWeight: 600, width: '35%' }}>{t(`ai.documents.fields.${key}`, { defaultValue: key })}</TableCell>
                        <TableCell>{formatFieldValue(value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary" mb={2}>—</Typography>
              )}

              {typeof selected.extractedFields?.summary === 'string' && selected.extractedFields.summary && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.summary')}</Typography>
                  <Typography variant="body2">{selected.extractedFields.summary}</Typography>
                </Box>
              )}

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.extractedText')}</Typography>
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', bgcolor: 'action.hover', borderRadius: 2, p: 2, m: 0, mb: 2, fontFamily: 'inherit', fontSize: '0.875rem' }}>
                {selected.extractedText || '—'}
              </Box>

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.segmentation')}</Typography>
              {selected.segmentation ? (
                <Box>
                  <Typography variant="body2">{`${t('ai.documents.provider')}: ${selected.segmentation.provider}`}</Typography>
                  {selected.segmentation.maskAreaRatio != null && (
                    <Typography variant="body2">{`${t('ai.documents.maskArea')}: ${formatRatioPercent(selected.segmentation.maskAreaRatio)}`}</Typography>
                  )}
                  {selected.segmentation.bbox != null && (
                    <Typography variant="body2">{`bbox: ${JSON.stringify(selected.segmentation.bbox)}`}</Typography>
                  )}
                  {selected.segmentation.confidence != null && (
                    <Typography variant="body2">{`${t('ai.confidence')}: ${formatRatioPercent(selected.segmentation.confidence)}`}</Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">—</Typography>
              )}

              {(selected.reviewStatus === 'pending_review' || selected.reviewStatus === 'confirmed') && (
                <Box mt={3} mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.correctFields')}</Typography>
                  <Box display="grid" gap={2} sx={{ gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    {FIELD_KEYS.map((key) => (
                      <TextField
                        key={key}
                        size="small"
                        type={DATE_FIELD_KEYS.has(key) ? 'date' : key === 'ageYears' ? 'number' : 'text'}
                        label={t(`ai.documents.fields.${key}`, { defaultValue: key })}
                        InputLabelProps={DATE_FIELD_KEYS.has(key) ? { shrink: true } : undefined}
                        multiline={key === 'summary'}
                        minRows={key === 'summary' ? 3 : undefined}
                        sx={key === 'summary' ? { gridColumn: '1 / -1' } : undefined}
                        value={fieldsForm[key] || ''}
                        onChange={(event) => setFieldsForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {selected.reviewStatus !== 'approved' && selected.reviewStatus !== 'rejected' && (
                <Box mt={3}>
                  <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                    <TextField
                      type="date"
                      label={t('common.startDate', { defaultValue: 'Start date' })}
                      InputLabelProps={{ shrink: true }}
                      value={reviewStartDate}
                      onChange={(event) => setReviewStartDate(event.target.value)}
                    />
                    <TextField
                      type="date"
                      label={t('common.endDate', { defaultValue: 'End date' })}
                      InputLabelProps={{ shrink: true }}
                      value={reviewEndDate}
                      onChange={(event) => setReviewEndDate(event.target.value)}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label={t('ai.documents.reviewNote')}
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                  />
                </Box>
              )}
              {selected.reviewNote && (
                <Typography variant="body2" color="text.secondary" mt={2}>
                  {`${t('ai.documents.reviewNote')}: ${selected.reviewNote}`}
                </Typography>
              )}
              {selected.approvedStartDate && (
                <Typography variant="body2" color="text.secondary" mt={2}>
                  {`${t('ai.documents.coverage')}: ${selected.approvedStartDate} → ${selected.approvedEndDate || selected.approvedStartDate}`}
                </Typography>
              )}
              {history.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.documents.history')}</Typography>
                  {history.map((rev) => (
                    <Typography key={rev.id} variant="body2" color="text.secondary">
                      {`• ${new Date(rev.createdAt).toLocaleString()} — ${rev.action} (${rev.actorRole})${rev.fromStatus || rev.toStatus ? `: ${rev.fromStatus || '—'} → ${rev.toStatus || '—'}` : ''}${rev.note ? ` — ${rev.note}` : ''}`}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selected && (selected.reviewStatus === 'approved' || selected.reviewStatus === 'rejected' || selected.reviewStatus === 'expired') && (
            <Button variant="outlined" disabled={reviewing} onClick={handleArchive}>
              {t('ai.documents.archive')}
            </Button>
          )}
          {selected && selected.reviewStatus !== 'approved' && selected.reviewStatus !== 'rejected' && selected.reviewStatus !== 'archived' && selected.reviewStatus !== 'expired' && (
            <>
              {(selected.reviewStatus === 'pending_review' || selected.reviewStatus === 'confirmed') && (
                <Button variant="outlined" disabled={reviewing} onClick={handleConfirm}>
                  {t('ai.documents.confirmExtracted')}
                </Button>
              )}
              <Button color="error" variant="outlined" disabled={reviewing} onClick={() => handleReview('rejected')}>
                {t('ai.documents.rejectJustification')}
              </Button>
              <Button variant="contained" color="success" disabled={reviewing} onClick={() => handleReview('approved')}>
                {t('ai.documents.approveJustification')}
              </Button>
            </>
          )}
          {selected && (
            <Button startIcon={<OpenInNew />} disabled={previewLoadingId === selected.id} onClick={() => void handlePreview(selected)}>
              {previewLoadingId === selected.id ? t('ai.documents.previewLoading') : t('ai.documents.openInPage')}
            </Button>
          )}
          {selected && (
            <Button startIcon={<Download />} disabled={downloadingId === selected.id} onClick={() => handleDownload(selected)}>
              {t('ai.documents.download')}
            </Button>
          )}
          <Button onClick={closeDialog}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
