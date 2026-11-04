import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Typography } from '@mui/material';
import SmartToy from '@mui/icons-material/SmartToy';
import { useTranslation } from 'react-i18next';
import GlassCard from '../common/GlassCard';
import AiRiskChip from './AiRiskChip';
import { formatRatioPercent, getErrorMessage } from './aiUtils';
import aiService from '../../services/aiService';
import type { AiPrediction } from '../../types';

interface ParentAiSummaryCardProps {
  schoolId: string;
  studentId: string;
}

export default function ParentAiSummaryCard({ schoolId, studentId }: ParentAiSummaryCardProps) {
  const { t, i18n } = useTranslation();
  const [prediction, setPrediction] = useState<AiPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!schoolId || !studentId) return;
    setLoading(true);
    try {
      const res = await aiService.getStudentPrediction(schoolId, studentId);
      setPrediction(res.data ?? null);
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentId, t]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (!schoolId || !studentId) return;
    setGenerating(true);
    setError('');
    try {
      const res = await aiService.generateParentSummary(schoolId, studentId, i18n.language);
      setPrediction(res.data ?? null);
    } catch (err) {
      setError(getErrorMessage(err, t('ai.loadFailed')));
    } finally {
      setGenerating(false);
    }
  };

  const sourceLabel = prediction ? (prediction.source === 'meta' ? t('ai.meta') : t('ai.heuristic')) : '';

  return (
    <GlassCard sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <SmartToy color="primary" />
        <Typography variant="h6" fontWeight={700}>{t('ai.parent.title')}</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
      ) : !prediction || !prediction.parentSummary ? (
        <Box>
          {prediction && (
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={2}>
              <AiRiskChip riskLevel={prediction.riskLevel} />
              <Chip size="small" variant="outlined" label={`${t('ai.successProbability')}: ${Math.round(prediction.successProbability)}%`} />
              <Chip size="small" variant="outlined" label={`${t('ai.attendance')}: ${formatRatioPercent(prediction.attendanceRate)}`} />
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" mb={2}>{t('ai.parent.empty')}</Typography>
          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            {generating ? t('ai.parent.generating') : t('ai.parent.generate')}
          </Button>
        </Box>
      ) : (
        <Box>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={2}>
            <AiRiskChip riskLevel={prediction.riskLevel} />
            <Chip size="small" variant="outlined" label={`${t('ai.successProbability')}: ${Math.round(prediction.successProbability)}%`} />
            <Chip size="small" variant="outlined" label={`${t('ai.attendance')}: ${formatRatioPercent(prediction.attendanceRate)}`} />
          </Box>
          <LinearProgress variant="determinate" value={Math.min(100, Math.max(0, prediction.successProbability))} sx={{ mb: 2, borderRadius: 1 }} />
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.generatedSummary')}</Typography>
          <Typography variant="body2" mb={2}>{prediction.parentSummary}</Typography>
          {prediction.recommendations.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{t('ai.recommendations')}</Typography>
              <Box component="ul" sx={{ m: 0, mb: 2, pl: 3 }}>
                {prediction.recommendations.map((item) => (
                  <li key={item}><Typography variant="body2">{item}</Typography></li>
                ))}
              </Box>
            </>
          )}
          <Typography variant="caption" color="text.secondary">
            {t('ai.parent.basedOn', { source: prediction.model ? `${sourceLabel} · ${prediction.model}` : sourceLabel })}
          </Typography>
        </Box>
      )}
    </GlassCard>
  );
}
