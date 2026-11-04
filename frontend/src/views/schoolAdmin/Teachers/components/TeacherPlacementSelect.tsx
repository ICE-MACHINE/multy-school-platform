import { useSchool } from '../../../../hooks/useSchool';
import ClassroomSelect from './ClassroomSelect';
import CourseSelect from './CourseSelect';

interface TeacherPlacementSelectProps {
  schoolId: string;
  value?: string | null;
  onChange: (id: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function TeacherPlacementSelect({ schoolId, value, onChange, size, fullWidth }: TeacherPlacementSelectProps) {
  const { schoolType } = useSchool();

  if (schoolType === 'private') {
    return <CourseSelect schoolId={schoolId} value={value} onChange={onChange} size={size} fullWidth={fullWidth} />;
  }
  return <ClassroomSelect schoolId={schoolId} value={value} onChange={onChange} size={size} fullWidth={fullWidth} />;
}
