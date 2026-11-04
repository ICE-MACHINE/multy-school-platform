import { useState, useCallback } from 'react';
import programService from '../../../../services/programService';
import lessonService from '../../../../services/lessonService';
import type { ProgramLike } from '../types';
import type { Course } from '../../../../types';
import i18n from '../../../../i18n';


export function useProgramActions(schoolId: string | undefined, course: Course | null, program: ProgramLike | null, fetchProgram: () => Promise<void>, fetchAll: () => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProgram = async (title: string, description: string, editingProgram: boolean) => {
    if (!schoolId || !course || !title.trim()) return;
    setSaving(true); setSaveError('');
    try {
      if (editingProgram && program) {
        await programService.update(schoolId, program.id, { title: title.trim(), description: description.trim() });
        setMsg({ type: 'success', text: i18n.t('program.programUpdated') });
      } else {
        await programService.create(schoolId, { title: title.trim(), description: description.trim(), courseId: course.id });
        setMsg({ type: 'success', text: i18n.t('program.programCreated') });
      }
      await fetchProgram();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.programSaveFailed'));
    } finally { setSaving(false); }
  };

  const handleDeleteProgram = async () => {
    if (!schoolId || !program) return;
    setSaving(true);
    try {
      await programService.delete(schoolId, program.id);
      setMsg({ type: 'success', text: i18n.t('program.programDeleted') });
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.programDeleteFailed'));
    } finally { setSaving(false); }
  };

  const handleSaveModule = async (moduleTitle: string, editingModuleId: string | null) => {
    if (!schoolId || !moduleTitle.trim()) return;
    if (!editingModuleId && !program) {
      setSaveError(i18n.t('program.noProgramYet'));
      return;
    }
    setSaving(true); setSaveError('');
    try {
      if (editingModuleId) {
        await programService.updateModule(schoolId, editingModuleId, { title: moduleTitle.trim() });
        setMsg({ type: 'success', text: i18n.t('program.moduleUpdated') });
      } else {
        await programService.createModule(schoolId, { title: moduleTitle.trim(), programId: program!.id, orderIndex: (program?.modules?.length || 0) + 1 });
        setMsg({ type: 'success', text: i18n.t('program.moduleAdded') });
      }
      await fetchProgram();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.moduleSaveFailed'));
    } finally { setSaving(false); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!schoolId) return;
    setSaving(true);
    try {
      await programService.deleteModule(schoolId, moduleId);
      setMsg({ type: 'success', text: i18n.t('program.moduleDeleted') });
      await fetchProgram();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.moduleDeleteFailed'));
    } finally { setSaving(false); }
  };

  const handleSaveLesson = async (moduleId: string, lessonTitle: string, editingLessonId: string | null) => {
    if (!schoolId || !lessonTitle.trim() || !course) return;
    setSaving(true); setSaveError('');
    try {
      if (editingLessonId) {
        await lessonService.update(schoolId, editingLessonId, { title: lessonTitle.trim() });
        setMsg({ type: 'success', text: i18n.t('program.lessonUpdated') });
      } else {
        const moduleLessons = program?.modules?.find((m) => m.id === moduleId)?.lessons || [];
        await lessonService.create(schoolId, {
          title: lessonTitle.trim(), courseId: course.id,
          programModuleId: moduleId, orderIndex: moduleLessons.length + 1, status: 'not_started',
        });
        setMsg({ type: 'success', text: i18n.t('program.lessonAdded') });
      }
      await fetchProgram(); await fetchAll();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.lessonSaveFailed'));
    } finally { setSaving(false); }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!schoolId) return;
    setSaving(true);
    try {
      await lessonService.delete(schoolId, lessonId);
      setMsg({ type: 'success', text: i18n.t('program.lessonDeleted') });
      await fetchProgram(); await fetchAll();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || i18n.t('program.lessonDeleteFailed'));
    } finally { setSaving(false); }
  };

  return {
    saving, saveError, setSaveError, msg, setMsg,
    handleSaveProgram, handleDeleteProgram,
    handleSaveModule, handleDeleteModule,
    handleSaveLesson, handleDeleteLesson,
  };
}
