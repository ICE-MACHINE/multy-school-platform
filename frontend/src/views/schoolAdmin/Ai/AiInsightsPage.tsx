import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import WarningAmber from '@mui/icons-material/WarningAmber';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import Dangerous from '@mui/icons-material/Dangerous';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Refresh from '@mui/icons-material/Refresh';
import Visibility from '@mui/icons-material/Visibility';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import StatsCard from '../../../components/common/StatsCard';
import GlassCard from '../../../components/common/GlassCard';
import SegmentedControl from '../../../components/common/SegmentedControl';
import DataTable, { type Column } from '../../../components/common/DataTable';
import AiRiskChip from '../../../components/ai/AiRiskChip';
import { formatRatioPercent, getErrorMessage } from '../../../components/ai/aiUtils';
import aiService from '../../../services/aiService';
import type { AiPrediction, AiRiskLevel, CurriculumIntelligence, FinancialIntelligence, NotificationAdminOverview } from '../../../types';

type RiskFilter = AiRiskLevel | 'all';

export default function AiInsightsPage() {
  const { t, i18n } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [allPredictions, setAllPredictions] = useState<AiPrediction[]>([]);
  const [predictions, setPredictions] = useState<AiPrediction[]>([]);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<AiPrediction | null>(null);
  const [finance, setFinance] = useState<FinancialIntelligence | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumIntelligence | null>(null);
  const [notificationOps, setNotificationOps] = useState<NotificationAdminOverview | null>(null);
  const [error, setError] = useState('');

  const loadPredictions = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const allRes = await aiService.getPredictions(schoolId);
      const all = allRes.data || [];
      setAllPredictions(all);
      if (riskFilter === 'all') {
        setPredictions(all);
      } else {
        const filteredRes = await aiService.getPredictions(schoolId, riskFilter);
        setPredictions(filteredRes.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [schoolId, riskFilter, t]);

  const loadOps = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [fin, cur, notif] = await Promise.all([
        aiService.getFinancialIntelligence(schoolId),
        aiService.getCurriculumIntelligence(schoolId),
        aiService.getNotificationIntelligence(schoolId),
      ]);
      setFinance(fin.data);
      setCurriculum(cur.data);
      setNotificationOps(notif.data);
    } catch {
      // Operations panels are additive; the main AI panels report load errors.
    }
  }, [schoolId]);

  useEffect(() => { loadPredictions(); }, [loadPredictions]);
  useEffect(() => { loadOps(); }, [loadOps]);

  const handleRunBatch = async () => {
    if (!schoolId) return;
    setRunning(true);
    setError('');
    try {
      await aiService.runBatch(schoolId, i18n.language);
      await loadPredictions();
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed'), t('ai.timeout')));
    } finally {
      setRunning(false);
    }
  };

  const handleRegenerate = async (prediction: AiPrediction) => {
    if (!schoolId) return;
    setRegeneratingId(prediction.studentId);
    setError('');
    try {
      await aiService.runStudentPrediction(schoolId, prediction.studentId, i18n.language);
      await loadPredictions();
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed'), t('ai.timeout')));
    } finally {
      setRegeneratingId(null);
    }
  };

  const columns: Column<AiPrediction>[] = [
    {
      id: 'student', label: t('students.student'), sortable: false,
      accessor: (p) => (
        <Typography variant="body2" fontWeight={600}>
          {p.student ? `${p.student.firstName} ${p.student.lastName}` : p.studentId}
        </Typography>
      ),
    },
    { id: 'riskLevel', label: t('common.status'), sortable: false, accessor: (p) => <AiRiskChip riskLevel={p.riskLevel} /> },
    {
      id: 'successProbability', label: t('ai.successProbability'), sortable: false,
      accessor: (p) => (
        <Box sx={{ minWidth: 120 }}>
          <Typography variant="body2" fontWeight={600}>{`${Math.round(p.successProbability)}%`}</Typography>
          <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, p.successProbability))} sx={{ mt: 0.5, borderRadius: 1 }} />
        </Box>
      ),
    },
    { id: 'attendanceRate', label: t('ai.attendance'), sortable: false, accessor: (p) => formatRatioPercent(p.attendanceRate) },
    { id: 'missedLessons', label: t('ai.missedLessons'), sortable: false, accessor: (p) => p.missedLessons },
    { id: 'completedLessons', label: t('ai.completedLessons'), sortable: false, accessor: (p) => p.completedLessons },
    {
      id: 'source', label: t('ai.source'), sortable: false,
      accessor: (p) => <Chip size="small" variant="outlined" color={p.source === 'meta' ? 'primary' : 'default'} label={p.source === 'meta' ? t('ai.meta') : t('ai.heuristic')} />,
    },
    {
      id: 'actions', label: t('common.actions'), sortable: false,
      accessor: (p) => (
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" startIcon={<Refresh />} disabled={regeneratingId === p.studentId} onClick={() => handleRegenerate(p)}>
            {t('ai.regenerate')}
          </Button>
          <Button size="small" variant="text" startIcon={<Visibility />} onClick={() => setSelected(p)}>
            {t('ai.viewSummary')}
          </Button>
        </Box>
      ),
    },
  ];

  const count = (level: AiRiskLevel) => allPredictions.filter((p) => p.riskLevel === level).length;

  return (
    <Box>
      <PageHeader
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        action={(
          <Button variant="contained" startIcon={<PlayArrow />} onClick={handleRunBatch} disabled={running}>
            {running ? t('ai.running') : t('ai.runBatch')}
          </Button>
        )}
      />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('ai.risk.low')} value={count('low')} icon={<CheckCircle />} color="#10b981" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('ai.risk.medium')} value={count('medium')} icon={<WarningAmber />} color="#f59e0b" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('ai.risk.high')} value={count('high')} icon={<ErrorOutline />} color="#ef4444" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard title={t('ai.risk.critical')} value={count('critical')} icon={<Dangerous />} color="#b91c1c" loading={loading} />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <SegmentedControl<RiskFilter>
          value={riskFilter}
          onChange={setRiskFilter}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'low', label: t('ai.risk.low') },
            { value: 'medium', label: t('ai.risk.medium') },
            { value: 'high', label: t('ai.risk.high') },
            { value: 'critical', label: t('ai.risk.critical') },
          ]}
        />
      </Box>

      <DataTable
        columns={columns}
        data={predictions}
        keyExtractor={(p) => p.id}
        loading={loading}
        searchable={false}
        emptyMessage={t('ai.noPredictions')}
      />

      {finance && (
        <GlassCard sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" fontWeight={700}>{t('ai.ops.financeTitle')}</Typography>
          <Box display="flex" gap={1} flexWrap="wrap" mt={2} mb={2}>
            <Chip label={`${t('ai.ops.collectedThisMonth')}: ${finance.actuals.collectedThisMonth}`} color="success" />
            <Chip label={`${t('ai.ops.expectedDue')}: ${finance.actuals.expectedMonthlyDue}`} variant="outlined" />
            <Chip label={`${t('ai.ops.collectionRate')}: ${finance.actuals.collectionRateThisMonth === null ? 'n/a' : `${finance.actuals.collectionRateThisMonth}%`}`} variant="outlined" />
            <Chip label={`${t('ai.ops.totalArrears')}: ${finance.actuals.totalArrearsAmount} (${finance.actuals.studentsInArrears})`} color={finance.actuals.totalArrearsAmount > 0 ? 'warning' : 'default'} />
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>{t('ai.ops.noExpenses')}</Alert>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('ai.ops.repeatLate')}</Typography>
          {finance.repeatLatePayers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" mb={2}>—</Typography>
          ) : finance.repeatLatePayers.slice(0, 5).map((s) => (
            <Typography key={s.studentId} variant="body2" color="text.secondary">
              {`• ${s.studentName}: ${s.arrearsAmount} (${s.unpaidMonths.join(', ')})`}
            </Typography>
          ))}
          <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>{t('ai.ops.forecastTitle')}</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {finance.forecasts.map((f) => (
              <Chip key={f.month} variant="outlined" label={`${f.month}: ${f.projectedCollections} [${t('ai.ops.forecastBadge')}]`} />
            ))}
          </Box>
        </GlassCard>
      )}

      {curriculum && (
        <GlassCard sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>{t('ai.ops.curriculumTitle')}</Typography>
          {curriculum.courses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">—</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('ai.ops.course')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('ai.ops.teacher')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('ai.ops.progress')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('ai.ops.projectedEnd')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('ai.ops.risk')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('ai.ops.untaught')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {curriculum.courses.slice(0, 10).map((c) => (
                    <TableRow key={c.courseId}>
                      <TableCell>{c.courseName}</TableCell>
                      <TableCell>{c.teacherName || '—'}</TableCell>
                      <TableCell>{`${c.taughtLessons}/${c.totalLessons} (${c.progressPct}%)`}</TableCell>
                      <TableCell>{c.projectedCompletionDate || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" color={c.riskLevel === 'high' ? 'error' : c.riskLevel === 'medium' ? 'warning' : 'success'} label={c.riskLevel} />
                      </TableCell>
                      <TableCell>{c.untaughtLessonTitles.slice(0, 3).join(', ') || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </GlassCard>
      )}

      {notificationOps && (
        <GlassCard sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" fontWeight={700}>{t('ai.ops.notificationsTitle')}</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>{t('ai.ops.bestSend')}</Typography>
          <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>{t('ai.ops.interventions')}</Typography>
          {notificationOps.interventions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t('ai.ops.noInterventions')}</Typography>
          ) : notificationOps.interventions.map((item, index) => (
            <Alert key={`${item.code}-${item.studentId}-${index}`} severity="warning" sx={{ mb: 1 }}>
              {`${item.studentName ? `${item.studentName}: ` : ''}${item.detail}`}
            </Alert>
          ))}
        </GlassCard>
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('ai.parentSummary')}</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={2}>
                <AiRiskChip riskLevel={selected.riskLevel} />
                <Chip size="small" variant="outlined" label={`${t('ai.successProbability')}: ${Math.round(selected.successProbability)}%`} />
                <Chip size="small" variant="outlined" label={`${t('ai.source')}: ${selected.source === 'meta' ? t('ai.meta') : t('ai.heuristic')}`} />
              </Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.generatedSummary')}</Typography>
              <Typography variant="body2" mb={2}>{selected.parentSummary || t('ai.parent.empty')}</Typography>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.factors')}</Typography>
              {selected.factors.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={2}>—</Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, mb: 2, pl: 3 }}>
                  {selected.factors.map((factor) => (
                    <li key={factor}><Typography variant="body2">{factor}</Typography></li>
                  ))}
                </Box>
              )}
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.recommendations')}</Typography>
              {selected.recommendations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">—</Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  {selected.recommendations.map((item) => (
                    <li key={item}><Typography variant="body2">{item}</Typography></li>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
