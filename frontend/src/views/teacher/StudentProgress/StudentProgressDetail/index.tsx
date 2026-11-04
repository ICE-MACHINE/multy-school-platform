import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { useSchool } from '../../../../hooks/useSchool';
import teacherService from '../../../../services/teacherService';
import QuranicProgress from './QuranicProgress';
import PrivateProgress from './PrivateProgress';
import KindergartenProgress from './KindergartenProgress';
import type { Student } from '../../../../types';
import { useTranslation } from 'react-i18next';


export default function StudentProgressDetail() {
  const { t } = useTranslation();
  const { schoolId, studentId } = useParams<{ schoolId: string; studentId: string }>();
  const { schoolType } = useSchool();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (schoolId && studentId) teacherService.getStudent(schoolId, studentId).then((res) => setStudent(res.data));
  }, [schoolId, studentId]);

  if (!student) return null;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>{t('common.back')}</Button>
      <Typography variant="h5" fontWeight={700} mb={3}>{t('progress.titleOf', { name: `${student.firstName} ${student.lastName}` })}</Typography>
      {schoolType === 'quranic' && <QuranicProgress student={student} />}
      {schoolType === 'private' && <PrivateProgress student={student} />}
      {schoolType === 'kindergarten' && <KindergartenProgress student={student} />}
    </Box>
  );
}
