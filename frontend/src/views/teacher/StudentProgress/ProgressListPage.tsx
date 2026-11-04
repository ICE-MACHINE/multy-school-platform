import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Avatar, Chip, LinearProgress, Tooltip } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import teacherService from '../../../services/teacherService';
import { useSchool } from '../../../hooks/useSchool';
import type { Student } from '../../../types';
import { useTranslation } from 'react-i18next';


const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'];
const MAX_HIZBS = 60;

const avatarColor = (id: string) =>
  AVATAR_COLORS[[...id].reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

interface ProgressRow {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  quranHizbs: number;
  quranCurrentSurahNumber?: number | null;
  healthStatus?: string;
}

export default function ProgressListPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await teacherService.getStudents(schoolId);
      setStudents(res.data || []);
    } catch {} finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { fetch(); }, [fetch]);

  const rows: ProgressRow[] = students.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    firstName: s.firstName,
    lastName: s.lastName,
    registrationNumber: s.registrationNumber,
    quranHizbs: s.quranHizbs ?? 0,
    quranCurrentSurahNumber: s.quranCurrentSurahNumber,
    healthStatus: s.healthStatus,
  }));

  const columns: Column<ProgressRow>[] = [
    {
      id: 'name',
      label: t('students.student'),
      accessor: (r) => (
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: avatarColor(r.id), width: 36, height: 36, fontSize: '0.95rem', fontWeight: 700 }}>
            {r.firstName[0]}
          </Avatar>
          <Box>
            <Typography fontWeight={600} variant="body2">{r.name}</Typography>
            <Typography variant="caption" color="text.secondary">{r.registrationNumber}</Typography>
          </Box>
        </Box>
      ),
    },
    ...(schoolType === 'quranic' ? [{
      id: 'quranHizbs',
      label: t('teacher.hizbs'),
      accessor: (r: ProgressRow) => (
        <Tooltip title={t('teacher.hizbsTooltip', { count: r.quranHizbs, max: MAX_HIZBS })}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 110 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min((r.quranHizbs / MAX_HIZBS) * 100, 100)}
                sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
              />
            </Box>
            <Chip
              size="small"
              icon={<MenuBookIcon fontSize="small" />}
              label={`${r.quranHizbs}`}
              sx={{ fontWeight: 700, minWidth: 52 }}
            />
          </Box>
        </Tooltip>
      ),
    } as Column<ProgressRow>] : []),
    {
      id: 'healthStatus',
      label: t('teacher.healthStatus'),
      accessor: (r) => r.healthStatus?.trim() ? (
        <Tooltip title={r.healthStatus}>
          <Chip
            size="small"
            variant="outlined"
            color="error"
            icon={<MedicalServicesIcon fontSize="small" />}
            label={r.healthStatus}
          />
        </Tooltip>
      ) : (
        <Typography variant="body2" color="success.main" fontWeight={500}>{t('teacher.healthy')}</Typography>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title={t('titles.studentsProgress')} subtitle={t('teacher.progressSubtitle')} />
      <DataTable<ProgressRow>
        columns={columns}
        data={rows}
        keyExtractor={(r) => r.id}
        loading={loading}
        onRowClick={(r) => navigate(`/s/${schoolId}/teacher/progress/${r.id}`)}
        emptyMessage={t('teacher.noStudentsInClass')}
      />
    </Box>
  );
}
