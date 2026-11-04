import { useContext } from 'react';
import { SchoolContext } from '../contexts/SchoolContext/SchoolContext';

export const useSchool = () => useContext(SchoolContext);
