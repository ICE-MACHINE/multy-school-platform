import { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Checkbox, Typography,
  Box, CircularProgress,
} from '@mui/material';
import type { MessageRecipient } from '../../types';
import { useTranslation } from 'react-i18next';


type GroupRole = 'school_admin' | 'teacher' | 'parent';

interface NewMessageDialogProps {
  open: boolean;
  role: GroupRole;
  recipients: MessageRecipient[];
  loading: boolean;
  sending: boolean;
  onClose: () => void;
  onSend: (selectedIds: string[], content: string) => void;
}

const AVATAR_COLORS = ['#0f62fe', '#24a148', '#8a3ffc', '#ee5396', '#ff832b', '#08bdba'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function NewMessageDialog({ open, role, recipients, loading, sending, onClose, onSend }: NewMessageDialogProps) {
  const { t } = useTranslation();
  const isTeacher = role === 'teacher';
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [content, setContent] = useState('');

  const keyOf = (r: MessageRecipient) => (isTeacher ? r.studentId! : r.parentId);
  const primaryOf = (r: MessageRecipient) => (isTeacher ? r.studentName || '' : r.parentName);
  const secondaryOf = (r: MessageRecipient) => (isTeacher ? t('messages.parentOf', { name: r.parentName }) : r.children && r.children.length > 0 ? t('messages.childrenOf', { names: r.children.join(', ') }) : undefined);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        (isTeacher ? (r.studentName || '').includes(q) : r.parentName.includes(q)) ||
        r.parentName.includes(q)
    );
  }, [recipients, search, isTeacher]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.includes(keyOf(r)));
  const canSend = selected.length > 0 && content.trim().length > 0 && !sending;
  const unitLabel = isTeacher ? t('messages.studentUnit') : t('messages.parentUnit');

  const handleClose = () => {
    if (sending) return;
    onClose();
    setSearch('');
    setSelected([]);
    setContent('');
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend(selected, content.trim());
    setSearch('');
    setSelected([]);
    setContent('');
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle component="div" sx={{ pb: 0.5 }}>
        <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
          {t('messages.newMessage')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isTeacher
            ? t('messages.teacherDialogHint')
            : t('messages.adminDialogHint')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={isTeacher ? t('messages.searchStudent') : t('messages.searchParent')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />

        <Box display="flex" alignItems="center" justifyContent="space-between" px={1} pb={0.5}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {recipients.length} {unitLabel}
          </Typography>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="caption" color="text.secondary">{t('messages.selectAll')}</Typography>
            <Checkbox
              size="small"
              checked={allSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  const ids = new Set([...selected, ...filtered.map(keyOf)]);
                  setSelected([...ids]);
                } else {
                  const filteredIds = new Set(filtered.map(keyOf));
                  setSelected(selected.filter((id) => !filteredIds.has(id)));
                }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
          ) : filtered.length === 0 ? (
            <Typography color="text.secondary" py={3} sx={{ textAlign: 'center' }}>
              {isTeacher ? t('messages.noStudents') : t('messages.noParents')}
            </Typography>
          ) : (
            <List dense disablePadding>
              {filtered.map((r) => (
                <ListItem
                  key={keyOf(r)}
                  disableGutters
                  sx={{ px: 1 }}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      size="small"
                      checked={selected.includes(keyOf(r))}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, keyOf(r)] : prev.filter((id) => id !== keyOf(r))
                        )
                      }
                    />
                  }
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: avatarColor(primaryOf(r)) }}>
                      {primaryOf(r).charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={primaryOf(r)}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondary={secondaryOf(r)}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder={t('messages.writeMessage')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mt: 1.5 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={sending}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={!canSend} startIcon={sending ? <CircularProgress size={16} color="inherit" /> : null}>
          {sending ? t('messages.sending') : selected.length > 0 ? t('messages.sendTo', { count: selected.length, unit: unitLabel }) : t('messages.send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
