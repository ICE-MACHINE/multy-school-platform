import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, CircularProgress, Grid, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AttachMoney from '@mui/icons-material/AttachMoney';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ChildCare from '@mui/icons-material/ChildCare';
import Dangerous from '@mui/icons-material/Dangerous';
import Info from '@mui/icons-material/Info';
import Refresh from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import Send from '@mui/icons-material/Send';
import SmartToy from '@mui/icons-material/SmartToy';
import TrendingUp from '@mui/icons-material/TrendingUp';
import WarningAmber from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import GlassCard from '../../../components/common/GlassCard';
import StatsCard from '../../../components/common/StatsCard';
import { getErrorMessage } from '../../../components/ai/aiUtils';
import superAdminAiService from '../../../services/superAdminAiService';
import type {
  AiBriefing, AiChatMessage, AiInsight, AiInsightSeverity, AiPredictionSource, AiRecommendationPriority,
  PlatformTrends,
} from '../../../types';

const SEVERITY_CONFIG: Record<AiInsightSeverity, { color: 'error' | 'warning' | 'info' | 'success'; icon: ReactNode }> = {
  critical: { color: 'error', icon: <Dangerous fontSize="small" /> },
  warning: { color: 'warning', icon: <WarningAmber fontSize="small" /> },
  info: { color: 'info', icon: <Info fontSize="small" /> },
  success: { color: 'success', icon: <CheckCircle fontSize="small" /> },
};

const PRIORITY_COLOR: Record<AiRecommendationPriority, 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

export default function AiAssistantPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<AiBriefing | null>(null);
  const [trends, setTrends] = useState<PlatformTrends | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [source, setSource] = useState<AiPredictionSource | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const loadBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const res = await superAdminAiService.getBriefing();
      setBriefing(res.data);
      if (res.data?.source) setSource(res.data.source);
    } catch (err) {
      setError(getErrorMessage(err, t('aiAssistant.loadFailed')));
    } finally {
      setBriefingLoading(false);
    }
  }, [t]);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await superAdminAiService.getInsights();
      setInsights(res.data || []);
    } catch (err) {
      setError((prev) => prev || getErrorMessage(err, t('aiAssistant.loadFailed')));
    } finally {
      setInsightsLoading(false);
    }
  }, [t]);

  const loadTrends = useCallback(async () => {
    try {
      const res = await superAdminAiService.getTrends();
      setTrends(res.data);
    } catch {
      // Trends panel is additive; briefing/insights errors already surface above.
    }
  }, []);

  useEffect(() => { loadBriefing(); }, [loadBriefing]);
  useEffect(() => { loadInsights(); }, [loadInsights]);
  useEffect(() => { loadTrends(); }, [loadTrends]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const priorityLabel = (priority: AiRecommendationPriority): string => {
    if (priority === 'high') return t('aiAssistant.priority.high');
    if (priority === 'medium') return t('aiAssistant.priority.medium');
    return t('aiAssistant.priority.low');
  };

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    const history = messages.slice(-10);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setSending(true);
    setError('');
    try {
      const res = await superAdminAiService.chat(message, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data?.source) setSource(res.data.source);
    } catch (err) {
      setError(getErrorMessage(err, t('aiAssistant.loadFailed')));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const suggestions = [
    t('aiAssistant.suggestions.capacity'),
    t('aiAssistant.suggestions.revenue'),
    t('aiAssistant.suggestions.risks'),
    t('aiAssistant.suggestions.growth'),
    t('aiAssistant.suggestions.contact'),
    t('aiAssistant.suggestions.trends'),
    t('aiAssistant.suggestions.plan'),
  ];

  const deltaChip = (deltaPct: number | null) => (
    <Chip
      size="small"
      color={deltaPct === null ? 'default' : deltaPct >= 0 ? 'success' : 'error'}
      label={deltaPct === null ? 'n/a' : `${deltaPct >= 0 ? '+' : ''}${deltaPct}%`}
    />
  );

  const snapshot = briefing?.snapshot;
  const formatMoney = (value: number) => `${value.toLocaleString()} ${t('common.currency')}`;

  return (
    <Box>
      <PageHeader
        title={t('aiAssistant.title')}
        subtitle={t('aiAssistant.subtitle')}
        action={source ? (
          <Chip
            icon={<SmartToy />}
            color={source === 'meta' ? 'primary' : 'default'}
            variant={source === 'meta' ? 'filled' : 'outlined'}
            label={source === 'meta' ? t('aiAssistant.sourceMeta') : t('aiAssistant.sourceHeuristic')}
          />
        ) : undefined}
      />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {snapshot && (
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard title={t('aiAssistant.totalSchools')} value={snapshot.totals.totalSchools} icon={<SchoolIcon />} color="#6366f1" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard title={t('aiAssistant.totalStudents')} value={snapshot.totals.totalStudents} icon={<ChildCare />} color="#10b981" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard title={t('aiAssistant.mrr')} value={formatMoney(snapshot.mrr)} icon={<AttachMoney />} color="#f59e0b" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard title={t('aiAssistant.newSchools')} value={snapshot.newSchoolsLast30Days} icon={<TrendingUp />} color="#3b82f6" />
          </Grid>
        </Grid>
      )}

      {trends && (
        <GlassCard sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>{t('aiAssistant.bi.title')}</Typography>
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>{t('aiAssistant.bi.collectionsNote')}</Alert>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip size="small" variant="outlined" label={`${t('aiAssistant.bi.collections')} ${t('aiAssistant.bi.vsPrev')}`} />
            {deltaChip(trends.currentVsPrevious.collections.deltaPct)}
            <Chip size="small" variant="outlined" label={t('aiAssistant.bi.last3')} />
            {deltaChip(trends.last3VsPrevious3Collections.deltaPct)}
          </Box>
          {trends.months.length === 0 ? (
            <Typography variant="body2" color="text.secondary">{t('aiAssistant.bi.noData')}</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto', mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('aiAssistant.bi.month')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('aiAssistant.bi.collections')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('aiAssistant.bi.payments')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('aiAssistant.bi.newSchools')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('aiAssistant.bi.newStudents')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trends.months.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell>{m.month}</TableCell>
                      <TableCell>{formatMoney(m.collections)}</TableCell>
                      <TableCell>{m.paymentCount}</TableCell>
                      <TableCell>{m.newSchools}</TableCell>
                      <TableCell>{m.newStudents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('aiAssistant.bi.drivers')}</Typography>
              {trends.drivers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">—</Typography>
              ) : trends.drivers.slice(0, 6).map((d, i) => (
                <Typography key={`${d.code}-${i}`} variant="body2" color="text.secondary">
                  {`• ${d.schoolName || (d.schools ? d.schools.join(', ') : d.code)}${d.deltaPct != null ? ` (${d.deltaPct}%)` : ''}`}
                </Typography>
              ))}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('aiAssistant.bi.churnRisks')}</Typography>
              {trends.churnRisks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">—</Typography>
              ) : trends.churnRisks.slice(0, 5).map((r) => (
                <Box key={r.schoolId} mb={1}>
                  <Chip size="small" color={r.level === 'high' ? 'error' : r.level === 'medium' ? 'warning' : 'default'} label={`${r.schoolName}: ${r.score}`} clickable onClick={() => navigate(`/superAdmin/schools/${r.schoolId}`)} />
                  <Typography variant="caption" display="block" color="text.secondary">{r.reasonCodes.join(', ')}</Typography>
                </Box>
              ))}
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>{t('aiAssistant.bi.planRecommendations')}</Typography>
              {trends.planRecommendations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">—</Typography>
              ) : trends.planRecommendations.slice(0, 5).map((p) => (
                <Typography key={p.schoolId} variant="body2" color="text.secondary">
                  {`• ${p.schoolName}: ${p.currentUsers}/${p.maxUsers} → ${t('aiAssistant.bi.suggested')} ${p.suggestedMaxUsers}; ${p.currentMessages}/${p.maxMessages} → ${p.suggestedMaxMessages}`}
                </Typography>
              ))}
              <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>{t('aiAssistant.bi.contactToday')}</Typography>
              {trends.contactToday.length === 0 ? (
                <Typography variant="body2" color="text.secondary">—</Typography>
              ) : trends.contactToday.slice(0, 5).map((c) => (
                <Typography key={c.schoolId} variant="body2" color="text.secondary">
                  {`• ${c.schoolName} [${c.urgencyScore}]: ${c.actionCodes.join(', ')}`}
                </Typography>
              ))}
            </Grid>
          </Grid>
        </GlassCard>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <GlassCard sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
                <Typography variant="h6" fontWeight={700}>{t('aiAssistant.briefing')}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => { void loadBriefing(); }}
                  disabled={briefingLoading}
                >
                  {briefingLoading ? t('aiAssistant.refreshing') : t('aiAssistant.refresh')}
                </Button>
              </Box>
              {briefingLoading && !briefing ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
              ) : briefing ? (
                <Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{briefing.summary}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    {`${t('aiAssistant.paymentsThisMonth')}: ${formatMoney(briefing.snapshot.paymentsThisMonth)}`}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>{t('aiAssistant.highlights')}</Typography>
                  {briefing.highlights.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  ) : (
                    <Box component="ul" sx={{ m: 0, pl: 3 }}>
                      {briefing.highlights.map((highlight) => (
                        <li key={highlight}><Typography variant="body2">{highlight}</Typography></li>
                      ))}
                    </Box>
                  )}
                  <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>{t('aiAssistant.recommendations')}</Typography>
                  {briefing.recommendations.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  ) : (
                    <Stack spacing={2}>
                      {briefing.recommendations.map((recommendation) => (
                        <Box key={`${recommendation.title}-${recommendation.description}`}>
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                            <Chip size="small" color={PRIORITY_COLOR[recommendation.priority]} label={priorityLabel(recommendation.priority)} />
                            <Typography variant="body2" fontWeight={600}>{recommendation.title}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" mt={0.5}>{recommendation.description}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">—</Typography>
              )}
            </GlassCard>

            <GlassCard sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={2}>{t('aiAssistant.insights')}</Typography>
              {insightsLoading ? (
                <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
              ) : insights.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('aiAssistant.noInsights')}</Typography>
              ) : (
                <Stack spacing={2}>
                  {insights.map((insight) => {
                    const severity = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.info;
                    return (
                      <Box key={insight.id}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Box sx={{ display: 'flex', color: `${severity.color}.main` }}>{severity.icon}</Box>
                          <Chip size="small" color={severity.color} label={insight.severity} />
                          {insight.category && <Chip size="small" variant="outlined" label={insight.category} />}
                          <Typography variant="body2" fontWeight={600}>{insight.title}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>{insight.message}</Typography>
                        {insight.schoolId && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color="primary"
                            clickable
                            sx={{ mt: 1 }}
                            label={insight.schoolName ? `${t('aiAssistant.viewSchool')}: ${insight.schoolName}` : t('aiAssistant.viewSchool')}
                            onClick={() => navigate(`/superAdmin/schools/${insight.schoolId}`)}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </GlassCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <GlassCard sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 560 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>{t('aiAssistant.chatTitle')}</Typography>
            <Box
              ref={messagesRef}
              sx={{ flex: 1, overflowY: 'auto', maxHeight: 520, pr: 0.5 }}
            >
              {messages.length === 0 && !sending ? (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%" py={6}>
                  <Typography variant="body2" color="text.secondary">{t('aiAssistant.emptyChat')}</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {messages.map((message, index) => (
                    <Box
                      key={`${message.role}-${index}`}
                      display="flex"
                      justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    >
                      <Box
                        sx={{
                          maxWidth: '82%',
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
                          bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                          color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                          border: message.role === 'user' ? 'none' : '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {sending && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">{t('aiAssistant.typing')}</Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary" fontWeight={600} mt={3} mb={1}>
              {t('aiAssistant.suggestedPrompts')}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              {suggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  variant="outlined"
                  clickable
                  disabled={sending}
                  onClick={() => { void handleSend(suggestion); }}
                />
              ))}
            </Box>

            <Box component="form" onSubmit={handleSubmit} display="flex" gap={1}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('aiAssistant.chatPlaceholder')}
                disabled={sending}
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                endIcon={<Send />}
                disabled={sending || !input.trim()}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {sending ? t('aiAssistant.sending') : t('aiAssistant.send')}
              </Button>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}
