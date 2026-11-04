import QuranProgressView from '../../../shared/QuranProgressView';
import type { Student } from '../../../../types';

export default function QuranicProgress({ student }: { student: Student }) {
  return <QuranProgressView student={student} />;
}
