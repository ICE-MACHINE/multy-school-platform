import { useState, useEffect } from 'react';
import { Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import classroomService from '../../../../services/classroomService';
import type { Classroom } from '../../../../types';

interface ClassroomSelectProps {
  schoolId: string;
  value?: string | null;
  onChange: (classroomId: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function ClassroomSelect({ schoolId, value, onChange, size = 'small', fullWidth }: ClassroomSelectProps) {
  const { t } = useTranslation();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    classroomService
      .getAll(schoolId)
      .then((res) => setClassrooms(res.data || []))
      .catch(() => {});
  }, [schoolId]);

  const availableClassrooms = classrooms.filter((c) => !c.teacher || c.id === value);

  return (
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as string)}
      size={size}
      displayEmpty
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { minWidth: 160 }}
      renderValue={(v) => (v ? availableClassrooms.find((c) => c.id === v)?.name : t('teachers.unassigned'))}
    >
      <MenuItem value="">{t('teachers.unassigned')}</MenuItem>
      {availableClassrooms.map((c) => (
        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
      ))}
    </Select>
  );
}
