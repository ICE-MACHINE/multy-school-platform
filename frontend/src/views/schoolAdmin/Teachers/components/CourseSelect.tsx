import { useState, useEffect } from 'react';
import { Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import courseService from '../../../../services/courseService';
import type { Course } from '../../../../types';

interface CourseSelectProps {
  schoolId: string;
  value?: string | null;
  onChange: (courseId: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function CourseSelect({ schoolId, value, onChange, size = 'small', fullWidth }: CourseSelectProps) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    courseService
      .getAll(schoolId)
      .then((res) => setCourses(res.data || []))
      .catch(() => {});
  }, [schoolId]);

  const availableCourses = courses.filter((c) => !c.teacherId || c.id === value);

  return (
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value as string)}
      size={size}
      displayEmpty
      fullWidth={fullWidth}
      sx={fullWidth ? undefined : { minWidth: 160 }}
      renderValue={(v) => (v ? availableCourses.find((c) => c.id === v)?.name : t('teachers.unassigned'))}
    >
      <MenuItem value="">{t('teachers.unassigned')}</MenuItem>
      {availableCourses.map((c) => (
        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
      ))}
    </Select>
  );
}
