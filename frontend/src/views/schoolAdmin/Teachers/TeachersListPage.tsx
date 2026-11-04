import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Chip, Avatar, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ViewIcon from '@mui/icons-material/Visibility';
import AssignIcon from '@mui/icons-material/MeetingRoom';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import ActionsMenu from '../../../components/common/ActionsMenu';
import EditTeacherDialog from './EditTeacherDialog';
import AssignClassroomDialog from './components/AssignClassroomDialog';
import { useTranslation } from 'react-i18next';
import teacherManagementService from '../../../services/teacherManagementService';
import { useSchool } from '../../../hooks/useSchool';
import type { Teacher } from '../../../types';

export default function TeachersListPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [assignTarget, setAssignTarget] = useState<Teacher | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await teacherManagementService.getAll(schoolId, { page: page + 1, limit: rowsPerPage });
      setTeachers(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [schoolId, page, rowsPerPage]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget || !schoolId) return;
    setDeleteLoading(true);
    try { await teacherManagementService.delete(schoolId, deleteTarget.id); fetch(); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const handleAssign = async (assignmentId: string) => {
    if (!schoolId || !assignTarget) return;
    const payload = isPrivate ? { courseId: assignmentId || null } : { classroomId: assignmentId || null };
    await teacherManagementService.update(schoolId, assignTarget.id, payload);
    fetch();
  };

  const columns: Column<Teacher>[] = [
    { id: 'name', label: t('teachers.teacher'), accessor: (r) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: '#6366f1', width: 36, height: 36 }}>{r.firstName[0]}{r.lastName[0]}</Avatar>
        <Box>
          <Typography fontWeight={600} variant="body2">{r.firstName} {r.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{r.phone}</Typography>
        </Box>
      </Box>
    )},
    { id: 'gender', label: t('common.gender'), accessor: (r) => <Chip label={r.gender === 'female' ? t('common.female') : t('common.male')} size="small" variant="outlined" /> },
    { id: 'assignment', label: isPrivate ? t('teachers.course') : t('teachers.classroom'), accessor: (r) => isPrivate
      ? (r.course?.name || <Typography color="text.secondary">{t('teachers.unassigned')}</Typography>)
      : (r.classroom?.name || <Typography color="text.secondary">{t('teachers.unassigned')}</Typography>) },
    { id: 'actions', label: t('common.actions'), sortable: false, accessor: (r) => (
      <ActionsMenu items={[
        { label: t('common.view'), icon: <ViewIcon fontSize="small" />, onClick: () => navigate(`/s/${schoolId}/admin/teachers/${r.id}`) },
        { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditTarget(r) },
        { label: isPrivate ? t('teachers.assignCourse') : t('teachers.assignClassroom'), icon: <AssignIcon fontSize="small" />, onClick: () => setAssignTarget(r) },
        { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => setDeleteTarget(r) },
      ]} />
    )},
  ];

  return (
    <Box>
      <PageHeader title={t('teachers.teachers')} subtitle={t('teachers.manage')} actionLabel={t('teachers.addTeacher')} onAction={() => navigate(`/s/${schoolId}/admin/teachers/create`)} />
      <DataTable columns={columns} data={teachers} keyExtractor={(r) => r.id} loading={loading}
        onRowClick={(r) => navigate(`/s/${schoolId}/admin/teachers/${r.id}`)}
        page={page} rowsPerPage={rowsPerPage} totalRows={total}
        onPageChange={(p) => setPage(p)} onRowsPerPageChange={(l) => { setRowsPerPage(l); setPage(0); }} />
      <ConfirmDialog open={!!deleteTarget} title={t('teachers.deleteTeacher')} message={t('teachers.deleteConfirm', { firstName: deleteTarget?.firstName, lastName: deleteTarget?.lastName })} confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      <EditTeacherDialog open={!!editTarget} teacher={editTarget} schoolId={schoolId} onClose={() => setEditTarget(null)}
        onSave={async (data) => { if (!editTarget || !schoolId) return; await teacherManagementService.update(schoolId, editTarget.id, data); fetch(); }} />
      <AssignClassroomDialog open={!!assignTarget} schoolId={schoolId} teacher={assignTarget} onClose={() => setAssignTarget(null)} onAssign={handleAssign} />
    </Box>
  );
}
