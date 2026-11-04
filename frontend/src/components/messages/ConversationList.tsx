import { useMemo, useState } from 'react';
import {
  Box, List, ListItemButton, ListItemAvatar, Avatar,
  Badge, TextField, InputAdornment, CircularProgress, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { alpha } from '@mui/material/styles';
import type { Conversation } from '../../types';
import { avatarColor, rowKey, formatListTime, listSectionLabel } from './messageUtils';
import { useTranslation } from 'react-i18next';


interface ConversationListProps {
  rows: Conversation[];
  loading: boolean;
  selectedKey: string | null;
  onSelect: (row: Conversation) => void;
  showStudentName: boolean;
  hideOnMobile?: boolean;
}

type FilterValue = 'all' | 'unread';


export default function ConversationList({ rows, loading, selectedKey, onSelect, showStudentName, hideOnMobile = false }: ConversationListProps) {
  const { t } = useTranslation();
  const SEGMENTS: { value: FilterValue; label: string }[] = [
    { value: 'all', label: t('common.all') },
    { value: 'unread', label: t('messages.unread') },
  ];
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  const filteredRows = useMemo(() => {
    let list = rows;
    if (filter === 'unread') list = list.filter((r) => r.unreadCount > 0);
    const q = search.trim();
    if (q) list = list.filter((r) => r.participantName.includes(q) || (r.studentName || '').includes(q));
    return list;
  }, [rows, filter, search]);

  const sections = useMemo(() => {
    const map = new Map<string, Conversation[]>();
    for (const r of filteredRows) {
      const label = listSectionLabel(r.lastMessageAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(r);
    }
    return [...map.entries()];
  }, [filteredRows]);

  const unreadTotal = rows.reduce((s, r) => s + r.unreadCount, 0);

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 340 },
        flexShrink: 0,
        display: { xs: hideOnMobile ? 'none' : 'flex', md: 'flex' },
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ p: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('messages.searchConversation')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: (t) => alpha(t.palette.common[ t.palette.mode === 'dark' ? 'white' : 'black'], t.palette.mode === 'dark' ? 0.08 : 0.05),
              '& fieldset': { border: 'none' },
            },
          }}
        />

        <Box
          sx={{
            mt: 1,
            display: 'flex',
            p: 0.5,
            borderRadius: 3,
            bgcolor: (t) => alpha(t.palette.common[t.palette.mode === 'dark' ? 'white' : 'black'], t.palette.mode === 'dark' ? 0.08 : 0.05),
          }}
        >
          {SEGMENTS.map((seg) => {
            const count = seg.value === 'unread' ? unreadTotal : rows.length;
            const active = filter === seg.value;
            return (
              <Box
                key={seg.value}
                onClick={() => setFilter(seg.value)}
                sx={{
                  flex: 1,
                  py: 0.75,
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  bgcolor: active ? 'background.paper' : 'transparent',
                  boxShadow: active ? 1 : 'none',
                  color: active ? 'text.primary' : 'text.secondary',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <Typography variant="caption" fontWeight={active ? 700 : 500} sx={{ fontSize: '0.75rem' }}>
                  {seg.label}
                  <Box component="span" sx={{ opacity: 0.7, fontWeight: 600 }}> ({count})</Box>
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
        ) : filteredRows.length === 0 ? (
          <Typography color="text.secondary" py={5} px={2} sx={{ textAlign: 'center', fontSize: '0.8125rem' }}>
            {filter === 'unread'
              ? t('messages.noUnreadMessages')
              : rows.length === 0
                ? t('messages.noConversationsStart')
                : t('common.noResults')}
          </Typography>
        ) : (
          <List disablePadding>
            {sections.map(([label, items]) => (
              <Box key={label}>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', px: 2, pt: 1, pb: 0.25, color: 'text.secondary', fontWeight: 600, fontSize: '0.6875rem' }}
                >
                  {label}
                </Typography>
                {items.map((r) => {
                  const unread = r.unreadCount > 0;
                  const selected = rowKey(r) === selectedKey;
                  return (
                    <ListItemButton
                      key={rowKey(r)}
                      selected={selected}
                      onClick={() => onSelect(r)}
                      sx={{
                        px: 1.5,
                        py: 1,
                        mx: 0.5,
                        my: 0.25,
                        borderRadius: 2.5,
                        alignItems: 'center',
                        '&.Mui-selected': {
                          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                          '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.15) },
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 50, mt: 0 }}>
                        <Badge
                          color="primary"
                          badgeContent={unread ? r.unreadCount : 0}
                          invisible={!unread}
                          overlap="circular"
                          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                          sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 17, height: 17, fontWeight: 700 } }}
                        >
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '14px',
                              fontSize: 18,
                              fontWeight: 600,
                              bgcolor: avatarColor(r.participantName),
                            }}
                          >
                            {r.participantName.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={1}>
                          <Typography
                            noWrap
                            sx={{ fontSize: '0.875rem', fontWeight: unread ? 700 : 500, flex: 1, minWidth: 0 }}
                          >
                            {r.participantName}
                          </Typography>
                          <Typography variant="caption" noWrap sx={{ fontSize: '0.6875rem', color: 'text.disabled', flexShrink: 0 }}>
                            {formatListTime(r.lastMessageAt)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                          <Typography
                            noWrap
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: '0.75rem',
                              color: unread ? 'primary.main' : 'text.secondary',
                              fontWeight: unread ? 600 : 400,
                            }}
                          >
                            {showStudentName && r.studentName ? `${r.studentName} · ` : ''}
                            {r.lastMessage || t('messages.startConversation')}
                          </Typography>
                          {unread && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                          )}
                        </Box>
                      </Box>
                    </ListItemButton>
                  );
                })}
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
