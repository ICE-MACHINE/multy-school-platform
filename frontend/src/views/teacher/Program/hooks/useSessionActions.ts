import { useState, useCallback } from 'react';
import courseSessionService from '../../../../services/courseSessionService';
import courseAttendanceService from '../../../../services/courseAttendanceService';
import type { CourseSession, CourseSessionAttendanceView } from '../../../../types';
import i18n from '../../../../i18n';


export function useSessionActions(schoolId: string | undefined, courseId: string | undefined, fetchAll: () => Promise<void>) {
  const [completeOpen, setCompleteOpen] = useState(false);
  const [sessionNumber, setSessionNumber] = useState('');
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().split('T')[0]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [removeSession, setRemoveSession] = useState<CourseSession | null>(null);

  const [attendanceSession, setAttendanceSession] = useState<CourseSession | null>(null);
  const [attendanceView, setAttendanceView] = useState<CourseSessionAttendanceView | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, boolean>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSession = async (period: 'morning' | 'afternoon') => {
    if (!schoolId || !courseId) return;
    const num = Number(sessionNumber);
    if (!Number.isInteger(num) || num < 1) { setSaveError(i18n.t('program.validSessionNumber')); return; }
    if (selectedLessonIds.length === 0) { setSaveError(i18n.t('program.selectLesson')); return; }
    setSaving(true); setSaveError('');
    try {
      await courseSessionService.complete(schoolId, courseId, {
        sessionNumber: num, completedAt, period, lessonIds: selectedLessonIds,
      });
      setCompleteOpen(false);
      setMsg({ type: 'success', text: i18n.t('program.sessionRecorded') });
      await fetchAll();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.sessionRecordFailed'));
    } finally { setSaving(false); }
  };

  const handleRemoveSession = async () => {
    if (!schoolId || !courseId || !removeSession) return;
    setSaving(true);
    try {
      await courseSessionService.remove(schoolId, courseId, removeSession.sessionNumber);
      setRemoveSession(null);
      setMsg({ type: 'success', text: i18n.t('program.sessionCancelled') });
      await fetchAll();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.sessionCancelFailed'));
      setRemoveSession(null);
    } finally { setSaving(false); }
  };

  const openAttendance = async (s: CourseSession) => {
    if (!schoolId || !courseId) return;
    setAttendanceSession(s); setAttendanceLoading(true); setAttendanceView(null);
    try {
      const res = await courseAttendanceService.getBySession(schoolId, courseId, s.sessionNumber);
      setAttendanceView(res.data);
      const draft: Record<string, boolean> = {};
      (res.data.attendance || []).forEach((r) => { draft[r.studentId] = r.isAbsent; });
      setAttendanceDraft(draft);
    } catch { setAttendanceView(null); } finally { setAttendanceLoading(false); }
  };

  const saveAttendance = async () => {
    if (!schoolId || !courseId || !attendanceSession) return;
    setSaving(true);
    try {
      await courseAttendanceService.bulkUpsert(schoolId, courseId, {
        sessionNumber: attendanceSession.sessionNumber,
        records: Object.entries(attendanceDraft).map(([studentId, isAbsent]) => ({ studentId, isAbsent })),
      });
      setAttendanceSession(null);
      setMsg({ type: 'success', text: i18n.t('program.attendanceSaved') });
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.attendanceRecordFailed'));
    } finally { setSaving(false); }
  };

  return {
    completeOpen, setCompleteOpen, sessionNumber, setSessionNumber,
    completedAt, setCompletedAt, selectedLessonIds, setSelectedLessonIds,
    removeSession, setRemoveSession,
    attendanceSession, setAttendanceSession, attendanceView, attendanceDraft, setAttendanceDraft,
    attendanceLoading, saving, saveError, setSaveError, msg, setMsg,
    handleSaveSession, handleRemoveSession, openAttendance, saveAttendance,
  };
}

export function useJustifyAction(schoolId: string | undefined, courseId: string | undefined, fetchRecords: () => Promise<void>) {
  const [justifyTarget, setJustifyTarget] = useState<any>(null);
  const [justifyText, setJustifyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJustify = async () => {
    if (!schoolId || !courseId || !justifyTarget) return;
    setSaving(true);
    try {
      await courseAttendanceService.justify(schoolId, courseId, justifyTarget.id, justifyText.trim());
      setJustifyTarget(null); setJustifyText('');
      setMsg({ type: 'success', text: i18n.t('teacher.justifiedSuccess') });
      await fetchRecords();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.response?.data?.message || i18n.t('program.justifyFailed') });
    } finally { setSaving(false); }
  };

  return { justifyTarget, setJustifyTarget, justifyText, setJustifyText, saving, msg, setMsg, handleJustify };
}
