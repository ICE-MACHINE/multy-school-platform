import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentsIcon from '@mui/icons-material/Payments';
import QuranIcon from '@mui/icons-material/MenuBook';
import { useTranslation } from 'react-i18next';
import studentService from '../../../../services/studentService';
import { useSchool } from '../../../../hooks/useSchool';
import ActionsMenu from '../../../../components/common/ActionsMenu';
import ProfileHeader from '../../../../components/common/ProfileHeader';
import DeletePreviewDialog, { type DeletePreviewGroup } from '../../../../components/common/DeletePreviewDialog';
import EditStudentDialog from '../EditStudentDialog';
import StudentInfo from './StudentInfo';
import PaymentSection from './PaymentSection';
import AttendanceSection from './AttendanceSection';
import CourseAttendanceSection from './CourseAttendanceSection';
import ProgressSection from './ProgressSection';
import type { Student, StudentDeletePreview } from '../../../../types';

export default function StudentDetailPage() {
  const { t } = useTranslation();
  const { schoolId, id } = useParams<{ schoolId: string; id: string }>();
  const navigate = useNavigate();
  const { schoolType } = useSchool();
  const [student, setStudent] = useState<Student | null>(null);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePreview, setDeletePreview] = useState<StudentDeletePreview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetch = useCallback(() => {
    if (schoolId && id) studentService.getById(schoolId, id).then((res) => setStudent(res.data));
  }, [schoolId, id]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async (data: any) => {
    if (!schoolId || !id) return;
    await studentService.update(schoolId, id, data);
    fetch();
  };

  const handleDelete = async () => {
    if (!schoolId || !id) return;
    setDeleteLoading(true);
    try {
      await studentService.delete(schoolId, id);
      navigate(`/s/${schoolId}/admin/students`);
    } catch {} finally { setDeleteLoading(false); setDeleteOpen(false); }
  };

  const handleOpenDelete = async () => {
    setDeleteOpen(true);
    setDeletePreview(null);
    if (!schoolId || !id) return;
    setPreviewLoading(true);
    try {
      const res = await studentService.getDeletePreview(schoolId, id);
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

  if (!student) return null;

  return (
    <Box>
      <ProfileHeader
        name={`${student.firstName} ${student.lastName}`}
        subtitle={
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Chip label={t('parents.registrationLabel', { number: student.registrationNumber })} size="small" variant="outlined" />
            <Chip label={student.gender === 'female' ? t('common.female') : t('common.male')} size="small"
              sx={{ bgcolor: student.gender === 'female' ? '#fdf2f8' : '#eff6ff', color: student.gender === 'female' ? '#db2777' : '#2563eb', fontWeight: 600 }} />
            {schoolType === 'quranic' && (
              <Chip icon={<QuranIcon />} label={t('students.hizbs', { count: student.quranHizbs ?? 0 })} size="small"
                sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 600 }} />
            )}
          </Box>
        }
        avatarText={`${student.firstName[0]}${student.lastName[0]}`}
        avatarGradient={student.gender === 'female' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}
        backLabel={t('students.backToStudents')}
        onBack={() => navigate(`/s/${schoolId}/admin/students`)}
        action={
          <ActionsMenu items={[
            { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditOpen(true) },
            { label: t('students.payments'), icon: <PaymentsIcon fontSize="small" />, onClick: () => navigate(`/s/${schoolId}/admin/payments/record?studentId=${student.id}`) },
            { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => handleOpenDelete() },
          ]} />
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={t('students.infoTab')} />
        <Tab label={t('students.paymentsTab')} />
        <Tab label={t('students.attendanceTab')} />
        <Tab label={schoolType === 'quranic' ? t('students.quranProgress') : schoolType === 'private' ? t('courses.courses') : t('students.activitiesTab')} />
      </Tabs>

      {tab === 0 && <StudentInfo student={student} />}
      {tab === 1 && <PaymentSection student={student} onUpdate={fetch} />}
      {tab === 2 && (schoolType === 'private' ? <CourseAttendanceSection student={student} /> : <AttendanceSection student={student} />)}
      {tab === 3 && <ProgressSection student={student} onUpdate={fetch} />}

      <EditStudentDialog open={editOpen} student={student} onClose={() => setEditOpen(false)} onSave={handleSave} />
      <DeletePreviewDialog
        open={deleteOpen}
        title={t('students.deleteStudent')}
        message={t('students.deleteConfirmDetail', { firstName: student.firstName, lastName: student.lastName })}
        groups={deleteGroups}
        totalRefund={deletePreview?.totalRefund || 0}
        noRefundsMessage={t('students.noRefundable')}
        confirmText={t('students.deleteStudent')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading || previewLoading}
      />
    </Box>
  );
}
