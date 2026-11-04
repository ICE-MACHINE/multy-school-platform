import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SchoolContext } from './SchoolContext';
import schoolService from '../../services/schoolService';
import type { School } from '../../types';

export function SchoolProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const match = location.pathname.match(/^\/s\/([^/]+)/);
  const schoolId = match ? match[1] : null;
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) {
      setCurrentSchool(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    schoolService.getPublicSchool(schoolId)
      .then((res) => { if (active) setCurrentSchool(res.data); })
      .catch(() => { if (active) setCurrentSchool(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [schoolId]);

  const setSchool = (school: School) => setCurrentSchool(school);

  return (
    <SchoolContext.Provider value={{ currentSchool, schoolId, schoolType: currentSchool?.type || null, setSchool, loading }}>
      {children}
    </SchoolContext.Provider>
  );
}
