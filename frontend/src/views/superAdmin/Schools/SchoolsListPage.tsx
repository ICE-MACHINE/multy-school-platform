import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Box, Avatar, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FreezeIcon from '@mui/icons-material/Block';
import UnfreezeIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import ActionsMenu from '../../../components/common/ActionsMenu';
import { useTranslation } from 'react-i18next';
import schoolService from '../../../services/schoolService';
import type { School } from '../../../types';

export default function SchoolsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await schoolService.getAll(page + 1, rowsPerPage);
      setSchools(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await schoolService.delete(deleteTarget.id);
      setSchools((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setTotal((prev) => prev - 1);
    } catch { } finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const handleFreeze = async (school: School) => {
    try {
      if (school.isFrozen) {
        await schoolService.unfreeze(school.id);
      } else {
        await schoolService.freeze(school.id);
      }
      setSchools((prev) => prev.map((s) => s.id === school.id ? { ...s, isFrozen: !s.isFrozen } : s));
    } catch { }
  };

  const columns: Column<School>[] = [
    { id: 'name', label: t('schools.school'), accessor: (row) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: row.type === 'quranic' ? '#f59e0b' : row.type === 'private' ? '#6366f1' : '#10b981', width: 36, height: 36 }}>
          {row.name[0]}
        </Avatar>
        <Box>
          <Typography fontWeight={600} variant="body2">{row.name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.slug}</Typography>
        </Box>
      </Box>
    )},
    { id: 'type', label: t('common.type'), accessor: (row) => (
      <Chip label={row.type} size="small" color={row.type === 'quranic' ? 'warning' : row.type === 'private' ? 'primary' : 'success'} variant="outlined" />
    )},
    { id: 'students', label: t('students.students'), accessor: (row) => row.studentCount ?? 0 },
    { id: 'status', label: t('common.status'), accessor: (row) => (
      <Chip label={row.isFrozen ? t('schools.frozen') : row.isActive ? t('common.active') : t('common.inactive')} size="small"
        color={row.isFrozen ? 'warning' : row.isActive ? 'success' : 'default'} />
    )},
    { id: 'actions', label: t('common.actions'), sortable: false, accessor: (row) => (
      <ActionsMenu items={[
        { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => navigate(`/superAdmin/schools/${row.slug}/edit`) },
        {
          label: row.isFrozen ? t('schools.unfreeze') : t('schools.freeze'),
          icon: row.isFrozen ? <UnfreezeIcon fontSize="small" /> : <FreezeIcon fontSize="small" />,
          color: row.isFrozen ? '#16a34a' : '#d97706',
          onClick: () => handleFreeze(row),
        },
        { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => setDeleteTarget(row) },
      ]} />
    )},
  ];

  return (
    <Box>
      <PageHeader title={t('titles.schools')} subtitle={t('schools.manageAll')} actionLabel={t('schools.addSchool')} onAction={() => navigate('/superAdmin/schools/create')} />
      <DataTable columns={columns} data={schools} keyExtractor={(r) => r.id} onRowClick={(r) => navigate(`/superAdmin/schools/${r.slug}`)}
        loading={loading} page={page} rowsPerPage={rowsPerPage} totalRows={total}
        onPageChange={(p) => setPage(p)} onRowsPerPageChange={(l) => { setRowsPerPage(l); setPage(0); }} />
      <ConfirmDialog open={!!deleteTarget} title={t('schools.deleteSchool')} message={t('schools.deleteConfirm', { name: deleteTarget?.name })}
        confirmText={t('common.delete')} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
    </Box>
  );
}
