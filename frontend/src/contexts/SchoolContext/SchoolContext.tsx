import { createContext } from 'react';
import type { SchoolContextType } from './school.types';

export const SchoolContext = createContext<SchoolContextType>({
  currentSchool: null,
  schoolId: null,
  schoolType: null,
  setSchool: () => {},
  loading: true,
});
