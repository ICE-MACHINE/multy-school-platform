import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Avatar, List, ListItem, ListItemAvatar, ListItemText, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import GenderIcon from '@mui/icons-material/Wc';
import ChildrenIcon from '@mui/icons-material/Group';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DetailCard, { InfoField } from '../../../components/common/DetailCard';
import ProfileHeader from '../../../components/common/ProfileHeader';
import ActionsMenu from '../../../components/common/ActionsMenu';
import DeletePreviewDialog, { type DeletePreviewGroup } from '../../../components/common/DeletePreviewDialog';
import EditParentDialog from './EditParentDialog';
import { useTranslation } from 'react-i18next';
import parentService from '../../../services/parentService';
import type { Parent, ParentDeletePreview } from '../../../types';

export default function ParentDetailPage() {
  const { t } = useTranslation();
  const { schoolId, id } = useParams<{ schoolId: string; id: string }>();
  const navigate = useNavigate();
  const [parent, setParent] = useState<Parent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePreview, setDeletePreview] = useState<ParentDeletePreview | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (schoolId && id) parentService.getById(schoolId, id).then((res) => setParent(res.data));
  }, [schoolId, id]);

  const handleSave = async (data: any) => {
    if (!schoolId || !id) return;
    await parentService.update(schoolId, id, data);
    const res = await parentService.getById(schoolId, id);
    setParent(res.data);
  };

  const handleDelete = async () => {
    if (!schoolId || !id) return;
    setDeleteLoading(true);
    try {
      await parentService.delete(schoolId, id);
      navigate(`/s/${schoolId}/admin/parents`);
    } catch {} finally { setDeleteLoading(false); setDeleteOpen(false); }
  };

  const handleOpenDelete = async () => {
    setDeleteOpen(true);
    setDeletePreview(null);
    if (!schoolId || !id) return;
    setPreviewLoading(true);
    try {
      const res = await parentService.getDeletePreview(schoolId, id);
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

  if (!parent) return null;

  const childrenCount = parent.children?.length || 0;

  return (
    <Box>
      <ProfileHeader
        name={`${parent.firstName} ${parent.lastName}`}
        avatarText={`${parent.firstName[0]}${parent.lastName[0]}`}
        avatarGradient={parent.gender === 'female' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #10b981, #059669)'}
        subtitle={<Chip label={t('parents.childChip', { count: childrenCount, childLabel: childrenCount === 1 ? t('parents.child') : t('parents.children') })} size="small" variant="outlined" icon={<ChildrenIcon />} />}
        backLabel={t('parents.backToParents')}
        onBack={() => navigate(`/s/${schoolId}/admin/parents`)}
        action={
          <ActionsMenu items={[
            { label: t('common.edit'), icon: <EditIcon fontSize="small" />, onClick: () => setEditOpen(true) },
            { label: t('common.delete'), icon: <DeleteIcon fontSize="small" />, color: '#dc2626', onClick: () => handleOpenDelete() },
          ]} />
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DetailCard title={t('teachers.contactData')} icon={<PhoneIcon />} iconColor="#10b981">
            <Box display="flex" flexDirection="column" gap={2.5}>
              <InfoField label={t('common.phone')} value={parent.phone} />
              <InfoField label={t('common.gender')} value={<Box display="flex" alignItems="center" gap={0.5}><GenderIcon fontSize="small" color="action" />{parent.gender === 'female' ? t('common.female') : t('common.male')}</Box>} />
              <InfoField label={t('parents.placeOfResidence')} value={<Box display="flex" alignItems="center" gap={0.5}><PlaceIcon fontSize="small" color="action" />{parent.placeOfResidence || t('common.notAvailable')}</Box>} />
            </Box>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <DetailCard title={t('parents.childrenCount', { count: childrenCount })} icon={<ChildrenIcon />} iconColor="#6366f1">
            {childrenCount > 0 ? (
              <List disablePadding>
                {(parent.children || []).map((child: any) => (
                  <ListItem
                    key={child.id}
                    onClick={() => navigate(`/s/${schoolId}/admin/students/${child.id}`)}
                    sx={{
                      borderRadius: 3,
                      mb: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                      transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                      '&:hover': {
                        bgcolor: 'action.selected',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
                      },
                      '&:last-child': { mb: 0 },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#6366f1', fontWeight: 700 }}>{child.firstName?.[0] || '?'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={600} variant="body2">{child.firstName} {child.lastName}</Typography>}
                      secondary={t('parents.registrationLabel', { number: child.registrationNumber })}
                      primaryTypographyProps={{ component: 'div' }}
                    />
                    <ChevronLeftIcon sx={{ color: 'text.disabled' }} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" py={3} textAlign="center">{t('parents.noChildren')}</Typography>
            )}
          </DetailCard>
        </Grid>
      </Grid>

      <EditParentDialog open={editOpen} parent={parent} onClose={() => setEditOpen(false)} onSave={handleSave} />
      <DeletePreviewDialog
        open={deleteOpen}
        title={t('parents.deleteParent')}
        message={t('parents.deleteConfirm', { firstName: parent.firstName, lastName: parent.lastName })}
        groups={deleteGroups}
        totalRefund={deletePreview?.totalRefund || 0}
        noRefundsMessage={t('parents.noFutureRefunds')}
        confirmText={t('parents.deleteParent')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleteLoading || previewLoading}
      />
    </Box>
  );
}
