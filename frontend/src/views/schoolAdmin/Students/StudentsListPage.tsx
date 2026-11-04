import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Chip, Typography, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../../../components/common/PageHeader';
import FilterRow from '../../../components/common/FilterBar';
import { pillFieldSx } from '../../../components/common/filterStyles';
import DataTable, { type Column } from '../../../components/common/DataTable';
import DeletePreviewDialog, { type DeletePreviewGroup } from '../../../components/common/DeletePreviewDialog';
import ActionsMenu from '../../../components/common/ActionsMenu';
import EditStudentDialog from './EditStudentDialog';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import studentService from '../../../services/studentService';
import classroomService from '../../../services/classroomService';
import courseService from '../../../services/courseService';
import { useSchool } from '../../../hooks/useSchool';
import type { Student, Classroom, Course, StudentDeletePreview } from '../../../types';

const getStatusMeta = (t: TFunction): Record<string, { label: string; bg: string; color: string }> => ({
  paid: { label: t('students.statusPaidCurrent'), bg: '#dcfce7', color: '#16a34a' },
  due: { label: t('students.statusDueCurrent'), bg: '#fee2e2', color: '#dc2626' },
  upcoming: { label: t('students.statusUpcoming'), bg: '#ffedd5', color: '#ea580c' },
  overdue: { label: t('students.statusOverdue'), bg: '#f3e8ff', color: '#9333ea' },
  exempt: { label: t('payments.exempt'), bg: '#f1f5f9', color: '#64748b' },
});

const getPrivateStatusMeta = (t: TFunction): Record<string, { label: string; bg: string; color: string }> => ({
  paid: { label: t('students.statusPaid'), bg: '#dcfce7', color: '#16a34a' },
  due: { label: t('students.statusDue'), bg: '#fee2e2', color: '#dc2626' },
  exempt: { label: t('payments.exempt'), bg: '#f1f5f9', color: '#64748b' },
});

const getStatusFilters = (t: TFunction) => [
  { value: '', label: t('common.all') },
  { value: 'paid', label: t('students.statusPaidCurrent') },
  { value: 'due', label: t('students.statusDueCurrent') },
  { value: 'upcoming', label: t('students.statusUpcoming') },
  { value: 'overdue', label: t('students.statusOverdue') },
  { value: 'exempt', label: t('payments.exempt') },
];

const getPrivateStatusFilters = (t: TFunction) => [
  { value: '', label: t('common.all') },
  { value: 'paid', label: t('students.statusPaid') },
  { value: 'due', label: t('students.statusDue') },
  { value: 'exempt', label: t('payments.exempt') },
];

export default function StudentsListPage() {
  const { t } = useTranslation();
  const STATUS_META = getStatusMeta(t);
  const PRIVATE_STATUS_META = getPrivateStatusMeta(t);
  const STATUS_FILTERS = getStatusFilters(t);
  const PRIVATE_STATUS_FILTERS = getPrivateStatusFilters(t);
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const isPrivate = schoolType === 'private';
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [section, setSection] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sections, setSections] = useState<(Classroom | Course)[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deletePreview, setDeletePreview] = useState<StudentDeletePreview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    if (isPrivate) {
      courseService.getAll(schoolId).then((res) => setSections(res.data || [])).catch(() => {});
    } else {
      classroomService.getAll(schoolId).then((res) => setSections(res.data || [])).catch(() => {});
    }
  }, [schoolId, isPrivate]);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await studentService.getAll(schoolId, {
        page: page + 1, limit: rowsPerPage, search, gender,
        classroomId: isPrivate ? '' : section,
        courseId: isPrivate ? section : '',
        paymentStatus,
      });
      setStudents(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [schoolId, page, rowsPerPage, search, gender, section, isPrivate, paymentStatus]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget || !schoolId) return;
    setDeleteLoading(true);
    try { await studentService.delete(schoolId, deleteTarget.id); fetch(); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const handleOpenDelete = async (student: Student) => {
    setDeleteTarget(student);
    setDeletePreview(null);
    if (!schoolId) return;
    setPreviewLoading(true);
    try {
      const res = await studentService.getDeletePreview(schoolId, student.id);
      setDeletePreview(res.data);
    } catch { setDeletePreview(null); }
    finally { setPreviewLoading(false); }
  };

  const deleteGroups: DeletePreviewGroup[] = [];
  if (deletePreview) {
    if (deletePreview.courseRefundItems && deletePreview.courseRefundItems.length > 0) {
      deleteGroups.push({
        title: t('parents.courseRefunds'),
        items: deletePreview.courseRefundItems.map((i) => ({ label: i.label + (i.courseName ? ` (${i.courseName})` : ''), amount: i.amount })),
        subtotal: deletePreview.courseRefundTotal,
      });
    }
    if (deletePreview.legacyRefundItems && deletePreview.legacyRefundItems.length > 0) {
      deleteGroups.push({
        title: t('students.unstudiedMonths'),
        items: deletePreview.legacyRefundItems.map((i) => ({ label: i.month, amount: i.amount })),
        subtotal: deletePreview.legacyRefundTotal,
      });
    }
  }

  const columns: Column<Student>[] = [
    { id: 'reg', label: t('students.registrationNumber'), accessor: (r) => <Typography fontWeight={600} variant="body2">{r.registrationNumber}</Typography> },
    { id: 'name', label: t('students.student'), accessor: (r) => <Typography>{r.firstName} {r.lastName}</Typography> },
    { id: 'gender', label: t('common.gender'), accessor: (r) => (
      <Chip label={r.gender === 'female' ? t('common.female') : t('common.male')} size="small"
        sx={{ bgcolor: r.gender === 'female' ? '#fdf2f8' : '#eff6ff', color: r.gender === 'female' ? '#db2777' : '#2563eb', fontWeight: 600 }} />
    )},
    { id: 'parent', label: t('students.parent'), accessor: (r) => r.parent ? `${r.parent.firstName} ${r.parent.lastName}` : t('common.notAvailable') },
    { id: 'classroom', label: isPrivate ? t('courses.courses') : t('students.classroom'), accessor: (r) =>
      isPrivate
        ? <Typography variant="body2">{r.enrolledCourses?.map((c) => c.name).join(', ') || <Typography component="span" color="text.secondary">{t('students.none')}</Typography>}</Typography>
        : r.classroom?.name || <Typography color="text.secondary">{t('common.notSpecified')}</Typography>
    },
    { id: 'status', label: t('students.paymentStatus'), accessor: (r) => {
      const meta = (isPrivate ? PRIVATE_STATUS_META : STATUS_META)[r.paymentStatus || 'paid'] || (isPrivate ? PRIVATE_STATUS_META.paid : STATUS_META.paid);
      return <Chip label={meta.label} size="small" sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }} />;
    }},
    { id: 'actions', label: t('common.actions'), sortable: false, accessor: (r) => (
      <ActionsMenu items={[
        { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditTarget(r) },
        { label: t('students.payments'), icon: <PaymentsIcon fontSize="small" />, onClick: () => navigate(`/s/${schoolId}/admin/payments/record?studentId=${r.id}`) },
        { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => handleOpenDelete(r) },
      ]} />
    )},
  ];

  return (
    <Box>
      <PageHeader title={t('students.students')} subtitle={t('students.manage')} actionLabel={t('students.addStudent')} onAction={() => navigate(`/s/${schoolId}/admin/students/create`)} />
      <FilterRow>
        <TextField size="small" fullWidth placeholder={t('students.searchPlaceholder')} value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ flex: 1, minWidth: 220, ...pillFieldSx }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            },
          }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{isPrivate ? t('courses.courses') : t('students.classroom')}</InputLabel>
          <Select label={isPrivate ? t('courses.courses') : t('students.classroom')} value={section} onChange={(e) => { setSection(e.target.value); setPage(0); }} sx={pillFieldSx}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="none">{t('students.withoutSectionCourse', { item: isPrivate ? t('students.courseSingular') : t('students.classroomSingular') })}</MenuItem>
            {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>{t('common.gender')}</InputLabel>
          <Select label={t('common.gender')} value={gender} onChange={(e) => { setGender(e.target.value); setPage(0); }} sx={pillFieldSx}>
            <MenuItem value="">{t('common.all')}</MenuItem>
            <MenuItem value="male">{t('common.male')}</MenuItem>
            <MenuItem value="female">{t('common.female')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>{t('students.paymentStatus')}</InputLabel>
          <Select label={t('students.paymentStatus')} value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(0); }} sx={pillFieldSx}>
            {(isPrivate ? PRIVATE_STATUS_FILTERS : STATUS_FILTERS).map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
      </FilterRow>
      <DataTable columns={columns} data={students} keyExtractor={(r) => r.id} loading={loading} searchable={false}
        onRowClick={(r) => navigate(`/s/${schoolId}/admin/students/${r.id}`)}
        rowSx={(r) => ({ bgcolor: r.gender === 'female' ? 'rgba(236, 72, 153, 0.05)' : 'rgba(37, 99, 235, 0.05)' })}
        page={page} rowsPerPage={rowsPerPage} totalRows={total}
        onPageChange={(p) => setPage(p)} onRowsPerPageChange={(l) => { setRowsPerPage(l); setPage(0); }} />
      <DeletePreviewDialog
        open={!!deleteTarget}
        title={t('students.deleteStudent')}
        message={t('students.deleteConfirm', { firstName: deleteTarget?.firstName, lastName: deleteTarget?.lastName })}
        groups={deleteGroups}
        totalRefund={deletePreview?.totalRefund || 0}
        noRefundsMessage={t('students.noFutureRefunds')}
        confirmText={t('students.deleteStudent')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading || previewLoading}
      />
      <EditStudentDialog open={!!editTarget} student={editTarget} onClose={() => setEditTarget(null)}
        onSave={async (data) => { if (!editTarget || !schoolId) return; await studentService.update(schoolId, editTarget.id, data); fetch(); }} />
    </Box>
  );
}
