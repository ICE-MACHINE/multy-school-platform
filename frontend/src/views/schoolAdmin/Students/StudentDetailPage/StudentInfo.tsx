import { Box, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import GenderIcon from '@mui/icons-material/Wc';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import RoomIcon from '@mui/icons-material/MeetingRoom';
import HealthIcon from '@mui/icons-material/Favorite';
import DetailCard, { InfoField } from '../../../../components/common/DetailCard';
import { useTranslation } from 'react-i18next';
import type { Student } from '../../../../types';

export default function StudentInfo({ student }: { student: Student }) {
  const { t } = useTranslation();
  return (
    <DetailCard title={t('students.personalData')} icon={<PersonIcon />}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('students.fullName')} value={`${student.firstName} ${student.lastName}`} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('students.registrationNumber')} value={student.registrationNumber} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <InfoField label={t('common.gender')} value={<Box display="flex" alignItems="center" gap={0.5}><GenderIcon fontSize="small" color="action" />{student.gender === 'female' ? t('common.female') : t('common.male')}</Box>} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}><InfoField label={t('students.dateOfBirth')} value={student.dateOfBirth || t('common.notAvailable')} /></Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <InfoField label={t('students.parent')} value={
            student.parent
              ? <Box display="flex" alignItems="center" gap={0.5}><FamilyIcon fontSize="small" color="action" />{`${student.parent.firstName} ${student.parent.lastName}`}</Box>
              : t('common.notAvailable')
          } />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <InfoField label={t('students.classroom')} value={
            student.classroom
              ? <Box display="flex" alignItems="center" gap={0.5}><RoomIcon fontSize="small" color="action" />{student.classroom.name}</Box>
              : t('common.notSpecified')
          } />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <InfoField label={t('students.healthStatusLabel')} value={
            student.healthStatus?.trim()
              ? <Box display="flex" alignItems="center" gap={0.5}><HealthIcon fontSize="small" color="error" />{student.healthStatus}</Box>
              : t('students.nothing')
          } />
        </Grid>
      </Grid>
    </DetailCard>
  );
}
