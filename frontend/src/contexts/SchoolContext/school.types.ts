import type { School, SchoolType } from '../../types';

export interface SchoolContextType {
  currentSchool: School | null;
  schoolId: string | null;
  schoolType: SchoolType | null;
  setSchool: (school: School) => void;
  loading: boolean;
}
