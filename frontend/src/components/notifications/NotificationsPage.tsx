import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemText, ListItemAvatar, Avatar, Typography,
  Button, Paper, Chip,
} from '@mui/material';
import NotifIcon from '@mui/icons-material/Notifications';
import AbsenceIcon from '@mui/icons-material/Warning';
import PayIcon from '@mui/icons-material/Payment';
import MessageIcon from '@mui/icons-material/Forum';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ActivityIcon from '@mui/icons-material/ChildCare';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PageHeader from '../../components/common/PageHeader';
import { useNotifications } from '../../hooks/useNotifications';
import aiService from '../../services/aiService';
import type { Notification, NotificationDigestResult, NotificationType } from '../../types';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const ICONS: Record<NotificationType, React.ReactNode> = {
  absence: <AbsenceIcon />,
  payment: <PayIcon />,
  message: <MessageIcon />,
  general: <NotifIcon />,
  activity: <ActivityIcon />,
  schedule_change: <ScheduleIcon />,
};

const AVATAR_COLORS: Record<NotificationType, string> = {
  absence: 'warning.main',
  payment: 'success.main',
  message: 'primary.main',
  general: 'grey.500',
  activity: 'info.main',
  schedule_change: 'error.main',
};

const typeLabel = (type: NotificationType) => i18n.t(`notifications.type.${type}`);

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return i18n.t('notifications.now');
  if (minutes < 60) return i18n.t('notifications.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return i18n.t('notifications.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return i18n.t('notifications.yesterday');
  if (days < 7) return i18n.t('notifications.daysAgo', { count: days });
  return new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const unread = notifications.filter((n) => !n.isRead).length;
  const [digest, setDigest] = useState<NotificationDigestResult | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    aiService.getNotificationDigest(schoolId, 7).then((res) => setDigest(res.data)).catch(() => {});
  }, [schoolId]);

  const resolveLink = (n: Notification) => {
    if (!n.link) return undefined;
    if (!schoolId) return n.link;
    if (n.link.startsWith('/s/')) {
      return n.link.replace(/^\/s\/[^/]+/, `/s/${schoolId}`);
    }
    if (n.link.startsWith('/messages')) {
      const rolePath = location.pathname.split('/')[3] || 'parent';
      return `/s/${schoolId}/${rolePath}/messages`;
    }
    if (n.link.startsWith('/')) {
      return `/s/${schoolId}${n.link}`;
    }
    return undefined;
  };

  const handleClick = (n: Notification) => {
    const target = resolveLink(n);
    if (target) navigate(target);
    if (!n.isRead) {
      markAsRead(n.id).catch(() => {});
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('common.notifications')}
        subtitle={unread > 0 ? t('notifications.unreadCount', { count: unread }) : t('notifications.noUnread')}
        action={
          unread > 0 ? (
            <Button variant="outlined" size="small" startIcon={<DoneAllIcon />} onClick={markAllAsRead}>
              {t('notifications.markAllRead')}
            </Button>
          ) : undefined
        }
      />

      {digest && digest.digest.total > 0 && (
        <Paper sx={{ borderRadius: 3, p: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {`${t('notifications.weeklyDigest', { defaultValue: 'Weekly digest' })}: ${digest.digest.total} (${digest.digest.unread} ${t('notifications.unread', { defaultValue: 'unread' })})`}
          </Typography>
          {digest.duplicatesCollapsed > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('notifications.duplicatesCollapsed', { defaultValue: '{{count}} similar notifications grouped', count: digest.duplicatesCollapsed })}
            </Typography>
          )}
          {digest.digest.urgentUnread.map((g) => (
            <Chip key={g.groupKey} size="small" color="error" variant="outlined" label={`${g.sampleTitle} ×${g.count}`} sx={{ mt: 1, mr: 1 }} />
          ))}
        </Paper>
      )}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <Box py={8} display="flex" flexDirection="column" alignItems="center" gap={1} color="text.secondary">
            <NotifIcon sx={{ fontSize: 56, opacity: 0.25 }} />
            <Typography>{t('notifications.noNotifications')}</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n, i) => {
              const Icon = ICONS[n.type];
              return (
                <Box key={n.id}>
                  <ListItemButton
                    onClick={() => handleClick(n)}
                    sx={{
                      px: 2,
                      py: 1.75,
                      alignItems: 'flex-start',
                      bgcolor: n.isRead ? 'transparent' : 'action.selected',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 56, mt: 0.5 }}>
                      <BadgeDot visible={!n.isRead}>
                        <Avatar sx={{ bgcolor: AVATAR_COLORS[n.type], width: 44, height: 44 }}>{Icon}</Avatar>
                      </BadgeDot>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography component="span" fontWeight={n.isRead ? 500 : 700} sx={{ fontSize: '0.9rem' }}>
                            {n.title}
                          </Typography>
                          <Chip label={typeLabel(n.type)} size="small" sx={{ height: 20, fontSize: '0.6875rem' }} />
                          <Typography component="span" variant="caption" color="text.disabled" sx={{ mr: 'auto' }}>
                            {timeAgo(n.createdAt)}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {n.message}
                          </Typography>
                          {n.link && <ChevronLeftIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0 }} />}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItemButton>
                  {i < notifications.length - 1 && <Box sx={{ height: 1, bgcolor: 'divider', mx: 2 }} />}
                </Box>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
}

function BadgeDot({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <Box position="relative" display="inline-flex">
      {children}
      {visible && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: 'error.main',
            border: '2px solid',
            borderColor: 'background.paper',
          }}
        />
      )}
    </Box>
  );
}
