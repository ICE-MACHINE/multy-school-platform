import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Chip, Avatar, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ViewIcon from '@mui/icons-material/Visibility';
import PageHeader from '../../../components/common/PageHeader';
import DataTable, { type Column } from '../../../components/common/DataTable';
import DeletePreviewDialog, { type DeletePreviewGroup } from '../../../components/common/DeletePreviewDialog';
import ActionsMenu from '../../../components/common/ActionsMenu';
import EditParentDialog from './EditParentDialog';
import { useTranslation } from 'react-i18next';
import parentService from '../../../services/parentService';
import type { Parent, ParentDeletePreview } from '../../../types';

export default function ParentsListPage() {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [deletePreview, setDeletePreview] = useState<ParentDeletePreview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<Parent | null>(null);

  const fetch = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await parentService.getAll(schoolId, { page: page + 1, limit: rowsPerPage });
      setParents(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [schoolId, page, rowsPerPage]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget || !schoolId) return;
    setDeleteLoading(true);
    try { await parentService.delete(schoolId, deleteTarget.id); fetch(); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  const handleOpenDelete = async (parent: Parent) => {
    setDeleteTarget(parent);
    setDeletePreview(null);
    if (!schoolId) return;
    setPreviewLoading(true);
    try {
      const res = await parentService.getDeletePreview(schoolId, parent.id);
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
    for (const c of deletePreview.legacyChildren || []) {
      deleteGroups.push({
        title: c.studentName,
        items: c.items.map((i) => ({ label: i.month || t('parents.paymentWithoutMonth'), amount: i.amount })),
        subtotal: c.subtotal,
      });
    }
  }

  const columns: Column<Parent>[] = [
    { id: 'name', label: t('parents.parent'), accessor: (r) => (
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar sx={{ bgcolor: '#10b981', width: 36, height: 36 }}>{r.firstName[0]}{r.lastName[0]}</Avatar>
        <Box>
          <Typography fontWeight={600} variant="body2">{r.firstName} {r.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{r.phone}</Typography>
        </Box>
      </Box>
    )},
    { id: 'gender', label: t('common.gender'), accessor: (r) => <Chip label={r.gender === 'female' ? t('common.female') : t('common.male')} size="small" variant="outlined" /> },
    { id: 'children', label: t('parents.children'), accessor: (r) => r.childrenCount ?? r.children?.length ?? 0 },
    { id: 'actions', label: t('common.actions'), sortable: false, accessor: (r) => (
      <ActionsMenu items={[
        { label: t('common.view'), icon: <ViewIcon fontSize="small" />, onClick: () => navigate(`/s/${schoolId}/admin/parents/${r.id}`) },
        { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditTarget(r) },
        { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => handleOpenDelete(r) },
      ]} />
    )},
  ];

  return (
    <Box>
      <PageHeader title={t('parents.parents')} subtitle={t('parents.manage')} actionLabel={t('parents.addParent')} onAction={() => navigate(`/s/${schoolId}/admin/parents/create`)} />
      <DataTable columns={columns} data={parents} keyExtractor={(r) => r.id} loading={loading}
        onRowClick={(r) => navigate(`/s/${schoolId}/admin/parents/${r.id}`)}
        page={page} rowsPerPage={rowsPerPage} totalRows={total}
        onPageChange={(p) => setPage(p)} onRowsPerPageChange={(l) => { setRowsPerPage(l); setPage(0); }} />
      <DeletePreviewDialog
        open={!!deleteTarget}
        title={t('parents.deleteParent')}
        message={t('parents.deleteConfirm', { firstName: deleteTarget?.firstName, lastName: deleteTarget?.lastName })}
        groups={deleteGroups}
        totalRefund={deletePreview?.totalRefund || 0}
        noRefundsMessage={t('parents.noFutureRefunds')}
        confirmText={t('parents.deleteParent')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading || previewLoading}
      />
      <EditParentDialog open={!!editTarget} parent={editTarget} onClose={() => setEditTarget(null)}
        onSave={async (data) => { if (!editTarget || !schoolId) return; await parentService.update(schoolId, editTarget.id, data); fetch(); }} />
    </Box>
  );
}
