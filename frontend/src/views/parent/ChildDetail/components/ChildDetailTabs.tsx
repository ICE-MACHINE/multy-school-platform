import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import ProgressIcon from '@mui/icons-material/TrendingUp';
import AttendanceIcon from '@mui/icons-material/EventNote';
import { useTranslation } from 'react-i18next';


interface ChildDetailTabsProps {
  active: 'progress' | 'attendance';
}

export default function ChildDetailTabs({ active }: ChildDetailTabsProps) {
  const { t } = useTranslation();
  const { schoolId, childId } = useParams<{ schoolId: string; childId: string }>();
  const navigate = useNavigate();

  const go = (tab: 'progress' | 'attendance') => {
    if (tab === active || !schoolId || !childId) return;
    navigate(`/s/${schoolId}/parent/${childId}/${tab}`);
  };

  return (
    <Tabs
      value={active}
      onChange={(_, v) => go(v)}
      sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Tab value="progress" label={t('parent.progressTab')} icon={<ProgressIcon />} iconPosition="start" />
      <Tab value="attendance" label={t('parent.absencesTab')} icon={<AttendanceIcon />} iconPosition="start" />
    </Tabs>
  );
}
