import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Button, Chip, CircularProgress, Alert, Tabs, Tab, Snackbar } from '@mui/material';
import CompleteIcon from '@mui/icons-material/EventAvailable';
import AttendanceIcon from '@mui/icons-material/HowToReg';
import PageHeader from '../../../components/common/PageHeader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import GlassSurface from '../../../components/common/GlassSurface';
import { useAuth } from '../../../hooks/useAuth';
import { useProgramData } from './hooks/useProgramData';
import { useProgramActions } from './hooks/useProgramActions';
import { useSessionActions, useJustifyAction } from './hooks/useSessionActions';
import { autoPeriod } from './types';
import ProgramTree from './components/ProgramTree';
import SessionsList from './components/SessionsList';
import AttendanceRecords from './components/AttendanceRecords';
import CompleteSessionDialog from './components/CompleteSessionDialog';
import AttendanceDialog from './components/AttendanceDialog';
import JustifyDialog from './components/JustifyDialog';
import ProgramFormDialog from './components/ProgramFormDialog';
import ModuleFormDialog from './components/ModuleFormDialog';
import LessonFormDialog from './components/LessonFormDialog';
import { useTranslation } from 'react-i18next';


export default function ProgramPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { user } = useAuth();
  const period = autoPeriod();

  const data = useProgramData(schoolId, user?.id);
  const actions = useProgramActions(schoolId!, data.course, data.program, data.fetchProgram, data.fetchAll);
  const session = useSessionActions(schoolId, data.course?.id, data.fetchAll);
  const justify = useJustifyAction(schoolId, data.course?.id, data.fetchRecords);

  const [tab, setTab] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [programFormOpen, setProgramFormOpen] = useState(false);
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [editingProgram, setEditingProgram] = useState(false);

  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const [lessonFormModuleId, setLessonFormModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null);
  const [deleteProgramOpen, setDeleteProgramOpen] = useState(false);

  useEffect(() => { if (tab === 1) data.fetchRecords(); }, [tab, data.fetchRecords]);

  const completedNumbers = data.sessions.filter((s) => s.completed).map((s) => s.sessionNumber);
  const maxCompleted = completedNumbers.length ? Math.max(...completedNumbers) : 0;
  const totalSessions = Number(data.course?.numberOfSessions || 0);
  const defaultNextSession = totalSessions > 0 && maxCompleted < totalSessions ? maxCompleted + 1 : null;

  const openCompleteDialog = () => {
    session.setSessionNumber(defaultNextSession ? String(defaultNextSession) : String(maxCompleted + 1));
    session.setCompletedAt(new Date().toISOString().split('T')[0]);
    session.setSelectedLessonIds([]);
    session.setSaveError('');
    session.setCompleteOpen(true);
  };

  const msg = session.msg || actions.msg || justify.msg;
  const setMsg = (v: { type: 'success' | 'error'; text: string } | null) => {
    session.setMsg(v); actions.setMsg(v); justify.setMsg(v);
  };

  return (
    <Box>
      <PageHeader title={t('titles.program')} subtitle={t('program.pageSubtitle')} />
      {data.loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress size={32} /></Box>
      ) : data.error ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>{data.error}</Alert>
      ) : !data.course ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>{t('program.noCourseAssigned')}</Alert>
      ) : (
        <>
          <GlassSurface sx={{ p: 2.5, mb: 3, borderRadius: 4 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h5" fontWeight={700}>{data.course.name}</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {data.course.hasMonthOption ? t('program.paymentMonthly') : data.course.hasSessionOption ? t('program.paymentPerSession', { count: data.course.numberOfSessions }) : data.course.hasCourseOption ? t('program.paymentPerCourse') : ''}
                </Typography>
              </Box>
              <Box display="flex" gap={1.5} alignItems="center">
                <Chip size="small" label={t('program.completedSessions', { completed: completedNumbers.length, total: totalSessions ? ` / ${totalSessions}` : '' })} color={completedNumbers.length > 0 ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                <Button variant="contained" startIcon={<CompleteIcon />} disabled={totalSessions > 0 && maxCompleted >= totalSessions} onClick={openCompleteDialog}>{t('program.completeSession')}</Button>
              </Box>
            </Box>
          </GlassSurface>

          <GlassSurface sx={{ borderRadius: 4, mb: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label={t('program.programAndSessions')} />
              <Tab label={t('program.attendanceTab')} />
            </Tabs>
          </GlassSurface>

          {tab === 0 && (
            <Box display="flex" flexDirection="column" gap={2.5}>
              <ProgramTree
                program={data.program} programLoading={data.programLoading}
                expandedModules={expandedModules} onToggleModule={(id) => setExpandedModules((p) => ({ ...p, [id]: !p[id] }))}
                onCreateProgram={() => { setEditingProgram(false); setProgramTitle(''); setProgramDescription(''); setProgramFormOpen(true); }}
                onEditProgram={() => { if (!data.program) return; setEditingProgram(true); setProgramTitle(data.program.title); setProgramDescription(data.program.description || ''); setProgramFormOpen(true); }}
                onDeleteProgram={() => setDeleteProgramOpen(true)}
                onAddModule={() => { setEditingModuleId(null); setModuleTitle(''); setModuleFormOpen(true); }}
                onEditModule={(m) => { setEditingModuleId(m.id); setModuleTitle(m.title); setModuleFormOpen(true); }}
                onDeleteModule={(id) => setDeleteModuleId(id)}
                onAddLesson={(mId) => { setLessonFormModuleId(mId); setLessonTitle(''); setEditingLessonId(null); }}
                onEditLesson={(mId, l) => { setLessonFormModuleId(mId); setLessonTitle(l.title); setEditingLessonId(l.id); }}
                onDeleteLesson={(id) => setDeleteLessonId(id)}
              />
              <SessionsList sessions={data.sessions} onOpenAttendance={session.openAttendance} onRemoveSession={(s) => session.setRemoveSession(s)} />
            </Box>
          )}

          {tab === 1 && (
            <AttendanceRecords
              records={data.records} recordsTotal={data.recordsTotal} recordsPage={data.recordsPage} recordsLoading={data.recordsLoading}
              recordDate={data.recordDate} recordSearch={data.recordSearch} recordFilter={data.recordFilter}
              onSetPage={data.setRecordsPage} onSetDate={data.setRecordDate} onSetSearch={data.setRecordSearch} onSetFilter={data.setRecordFilter}
              onJustify={(r) => { justify.setJustifyTarget(r); justify.setJustifyText(''); }}
            />
          )}
        </>
      )}

      <CompleteSessionDialog open={session.completeOpen} onClose={() => session.setCompleteOpen(false)}
        sessionNumber={session.sessionNumber} onSetSessionNumber={session.setSessionNumber}
        completedAt={session.completedAt} onSetCompletedAt={session.setCompletedAt}
        lessons={data.lessons} selectedLessonIds={session.selectedLessonIds}
        onToggleLesson={(id) => session.setSelectedLessonIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        defaultNextSession={defaultNextSession} totalSessions={totalSessions} maxCompleted={maxCompleted}
        saveError={session.saveError} saving={session.saving} onSave={() => session.handleSaveSession(period)} />

      <AttendanceDialog session={session.attendanceSession} onClose={() => session.setAttendanceSession(null)}
        attendanceView={session.attendanceView} attendanceDraft={session.attendanceDraft}
        onToggleAbsent={(sId, isAbsent) => session.setAttendanceDraft((p) => ({ ...p, [sId]: isAbsent }))}
        loading={session.attendanceLoading} saving={session.saving} saveError={session.saveError} onSave={session.saveAttendance} />

      <JustifyDialog open={!!justify.justifyTarget} onClose={() => justify.setJustifyTarget(null)}
        studentName={`${justify.justifyTarget?.student?.firstName || ''} ${justify.justifyTarget?.student?.lastName || ''}`}
        text={justify.justifyText} onSetText={justify.setJustifyText} saving={justify.saving}
        error={justify.msg?.type === 'error' ? justify.msg.text : ''} onConfirm={justify.handleJustify} />

      <ProgramFormDialog open={programFormOpen} onClose={() => setProgramFormOpen(false)} editing={editingProgram}
        title={programTitle} onSetTitle={setProgramTitle} description={programDescription} onSetDescription={setProgramDescription}
        saveError={actions.saveError} saving={actions.saving} onSave={() => actions.handleSaveProgram(programTitle, programDescription, editingProgram)} />

      <ModuleFormDialog open={moduleFormOpen} onClose={() => setModuleFormOpen(false)} editing={!!editingModuleId}
        title={moduleTitle} onSetTitle={setModuleTitle} saveError={actions.saveError} saving={actions.saving}
        onSave={() => actions.handleSaveModule(moduleTitle, editingModuleId)} />

      <LessonFormDialog open={!!lessonFormModuleId} onClose={() => { setLessonFormModuleId(null); setEditingLessonId(null); }}
        editing={!!editingLessonId} title={lessonTitle} onSetTitle={setLessonTitle}
        saveError={actions.saveError} saving={actions.saving}
        onSave={() => lessonFormModuleId && actions.handleSaveLesson(lessonFormModuleId, lessonTitle, editingLessonId)} />

      <ConfirmDialog open={!!session.removeSession} title={t('program.cancelCompletionTitle')}
        message={t('program.cancelCompletionMessage', { number: session.removeSession?.sessionNumber ?? '' })}
        confirmText={t('program.cancelCompletion')} onConfirm={session.handleRemoveSession} onCancel={() => session.setRemoveSession(null)} loading={session.saving} />

      <ConfirmDialog open={!!deleteLessonId} title={t('program.deleteLessonTitle')}
        message={t('program.deleteLessonMessage')}
        confirmText={t('common.delete')} onConfirm={() => { if (deleteLessonId) actions.handleDeleteLesson(deleteLessonId); setDeleteLessonId(null); }}
        onCancel={() => setDeleteLessonId(null)} loading={actions.saving} />

      <ConfirmDialog open={!!deleteModuleId} title={t('program.deleteModuleTitle')}
        message={t('program.deleteModuleMessage')}
        confirmText={t('common.delete')} onConfirm={() => { if (deleteModuleId) actions.handleDeleteModule(deleteModuleId); setDeleteModuleId(null); }}
        onCancel={() => setDeleteModuleId(null)} loading={actions.saving} />

      <ConfirmDialog open={deleteProgramOpen} title={t('program.deleteProgramTitle')}
        message={t('program.deleteProgramMessage')}
        confirmText={t('common.delete')} onConfirm={actions.handleDeleteProgram} onCancel={() => setDeleteProgramOpen(false)} loading={actions.saving} />

      <Snackbar open={!!msg} autoHideDuration={2500} onClose={() => setMsg(null)}>
        <Alert severity={msg?.type} onClose={() => setMsg(null)} sx={{ borderRadius: 2 }}>{msg?.text}</Alert>
      </Snackbar>
    </Box>
  );
}
