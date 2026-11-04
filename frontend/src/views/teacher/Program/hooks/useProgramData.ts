import { useState, useCallback, useEffect } from 'react';
import courseService from '../../../../services/courseService';
import courseSessionService from '../../../../services/courseSessionService';
import courseAttendanceService from '../../../../services/courseAttendanceService';
import lessonService from '../../../../services/lessonService';
import programService from '../../../../services/programService';
import type { Course, CourseSession, CourseAttendance } from '../../../../types';
import type { ProgramLike, LessonLike } from '../types';
import i18n from '../../../../i18n';


export function useProgramData(schoolId?: string, userId?: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonLike[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [program, setProgram] = useState<ProgramLike | null>(null);
  const [programLoading, setProgramLoading] = useState(false);

  const [records, setRecords] = useState<CourseAttendance[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsPage, setRecordsPage] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordDate, setRecordDate] = useState('');
  const [recordSearch, setRecordSearch] = useState('');
  const [recordFilter, setRecordFilter] = useState<'all' | 'absent'>('all');

  const fetchProgram = useCallback(async () => {
    if (!schoolId || !course) return;
    setProgramLoading(true);
    try {
      const res = await programService.getByCourse(schoolId, course.id);
      setProgram(res.data || null);
    } catch {
      setProgram(null);
    } finally {
      setProgramLoading(false);
    }
  }, [schoolId, course?.id]);

  const fetchAll = useCallback(async () => {
    if (!schoolId || !userId) return;
    setLoading(true);
    setError('');
    try {
      const coursesRes = await courseService.getAll(schoolId);
      const myCourse = (coursesRes.data || []).find((c) => c.teacherId === userId) || null;
      setCourse(myCourse);
      if (myCourse) {
        const [lessonsRes, sessionsRes] = await Promise.all([
          lessonService.getAll(schoolId, myCourse.id),
          courseSessionService.getSessions(schoolId, myCourse.id),
        ]);
        setLessons(lessonsRes.data || []);
        setSessions(sessionsRes.data || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || i18n.t('program.programDataLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [schoolId, userId]);

  const fetchRecords = useCallback(async () => {
    if (!schoolId || !course) return;
    setRecordsLoading(true);
    try {
      const filters: Record<string, string | undefined> = { date: recordDate || undefined, search: recordSearch || undefined };
      if (recordFilter === 'absent') filters.isAbsent = 'true';
      const res = await courseAttendanceService.getByCourse(schoolId, course.id, filters, recordsPage + 1, 50);
      setRecords(res.data || []);
      setRecordsTotal(res.pagination?.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [schoolId, course, recordDate, recordSearch, recordFilter, recordsPage]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (course) fetchProgram(); }, [course, fetchProgram]);

  return {
    course, lessons, sessions, loading, error,
    program, programLoading, setProgram, fetchProgram, fetchAll,
    records, recordsTotal, recordsPage, setRecordsPage,
    recordsLoading, recordDate, setRecordDate,
    recordSearch, setRecordSearch, recordFilter, setRecordFilter,
    fetchRecords,
  };
}
