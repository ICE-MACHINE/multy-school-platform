import { Fragment, type RefObject } from 'react';
import {
  Box, Avatar, Typography, IconButton, TextField, CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import BackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import ForumIcon from '@mui/icons-material/Forum';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { alpha } from '@mui/material/styles';
import type { Conversation, ConversationThread, Message } from '../../types';
import { avatarColor, formatMessageTime, groupByDay } from './messageUtils';
import { useTranslation } from 'react-i18next';


interface ConversationThreadProps {
  selectedRow: Conversation | null;
  threadMeta: ConversationThread['conversation'] | null;
  thread: Message[] | null;
  loadingThread: boolean;
  draft: string;
  sending: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onBack: () => void;
}

function MessageBubble({ message }: { message: Message }) {
  const mine = message.mine;
  return (
    <Box display="flex" justifyContent={mine ? 'flex-end' : 'flex-start'} mb={1}>
      <Box
        sx={{
          maxWidth: '78%',
          px: 1.75,
          py: 1,
          animation: 'msgIn 180ms ease',
          '@keyframes msgIn': {
            from: { opacity: 0, transform: 'translateY(6px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          ...(mine
            ? {
                borderRadius: '20px 20px 20px 6px',
                background: 'linear-gradient(135deg, #4589ff, #0f62fe)',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(15, 98, 254, 0.28)',
              }
            : {
                borderRadius: '20px 20px 6px 20px',
                bgcolor: (t: any) => alpha(t.palette.background.paper, 0.9),
                color: 'text.primary',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
              }),
        }}
      >
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem', lineHeight: 1.65 }}
        >
          {message.content}
        </Typography>
        <Box display="flex" justifyContent="flex-start" alignItems="center" gap={0.25} mt={0.25} sx={{ direction: 'rtl' }}>
          <Typography variant="caption" sx={{ fontSize: '0.625rem', opacity: 0.75 }}>
            {formatMessageTime(message.createdAt)}
          </Typography>
          {mine &&
            (message.isRead ? (
              <DoneAllIcon sx={{ fontSize: 13, opacity: 0.9 }} />
            ) : (
              <DoneIcon sx={{ fontSize: 13, opacity: 0.7 }} />
            ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function ConversationThread({
  selectedRow, threadMeta, thread, loadingThread, draft, sending,
  scrollRef, onDraftChange, onSend, onBack,
}: ConversationThreadProps) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: { xs: selectedRow ? 'flex' : 'none', md: 'flex' },
        flexDirection: 'column',
        bgcolor: 'transparent',
      }}
    >
      {!selectedRow ? (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" flex={1} color="text.secondary" gap={1.5} px={3}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t: any) => alpha(t.palette.primary.main, 0.12),
            }}
          >
            <ForumIcon sx={{ fontSize: 34, color: 'primary.main', opacity: 0.7 }} />
          </Box>
          <Typography variant="body2" fontWeight={500}>{t('messages.selectConversation')}</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', maxWidth: 260 }}>
            {t('messages.selectConversationHint')}
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              bgcolor: (t: any) => alpha(t.palette.background.paper, 0.7),
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <IconButton size="small" onClick={onBack} sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
              <BackIcon />
            </IconButton>
            <Avatar sx={{ width: 40, height: 40, borderRadius: '13px', fontSize: 17, fontWeight: 600, bgcolor: avatarColor(selectedRow.participantName) }}>
              {selectedRow.participantName.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ fontSize: '0.875rem' }}>
                {threadMeta?.participantName ?? selectedRow.participantName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.6875rem' }}>
                {selectedRow.studentName
                  ? t('messages.aboutStudent', { name: selectedRow.studentName })
                  : threadMeta?.studentName
                    ? t('messages.aboutStudent', { name: threadMeta.studentName })
                    : ''}
              </Typography>
            </Box>
          </Box>

          <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', px: { xs: 1.5, md: 2 }, py: 2 }}>
            {loadingThread ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
            ) : thread && thread.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" color="text.secondary" gap={1.5}>
                <EmailIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                <Typography variant="body2">{t('messages.startFirstMessage')}</Typography>
              </Box>
            ) : (
              groupByDay(thread || []).map((section) => (
                <Fragment key={section.label}>
                  <Box display="flex" justifyContent="center" my={1.25}>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 999,
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'text.secondary',
                        bgcolor: (t: any) => alpha(t.palette.text.secondary, 0.1),
                      }}
                    >
                      {section.label}
                    </Typography>
                  </Box>
                  {section.messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}
                </Fragment>
              ))
            )}
          </Box>

          <Box
            sx={{
              px: 1.5,
              py: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              bgcolor: (t: any) => alpha(t.palette.background.paper, 0.7),
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder={t('messages.typeMessage')}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              multiline
              maxRows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  bgcolor: (t: any) => alpha(t.palette.background.paper, 0.9),
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <IconButton
              onClick={onSend}
              disabled={!draft.trim() || sending}
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #4589ff, #0f62fe)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(15, 98, 254, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3d7bf5, #0a58d4)',
                  color: '#fff',
                },
                '&.Mui-disabled': {
                  background: (t: any) => alpha(t.palette.text.secondary, 0.15),
                  color: 'text.disabled',
                  boxShadow: 'none',
                },
              }}
            >
              {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}
