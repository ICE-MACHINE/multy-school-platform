import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { AiRiskLevel } from '../../types';

const RISK_COLOR: Record<AiRiskLevel, 'success' | 'warning' | 'error'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

export default function AiRiskChip({ riskLevel }: { riskLevel: AiRiskLevel }) {
  const { t } = useTranslation();
  return <Chip size="small" variant="filled" color={RISK_COLOR[riskLevel]} label={t(`ai.risk.${riskLevel}`)} />;
}
