import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Paper, Button, Snackbar, Alert,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PageHeader from '../../components/common/PageHeader';
import messageService from '../../services/messageService';
import { useNotifications } from '../../hooks/useNotifications';
import NewMessageDialog from './NewMessageDialog';
import ConversationList from './ConversationList';
import ConversationThreadView from './ConversationThread';
import { rowKey } from './messageUtils';
import type { Conversation, ConversationThread, Message, MessageRecipient } from '../../types';
import { useTranslation } from 'react-i18next';


type MessagesRole = 'school_admin' | 'teacher' | 'parent';

interface MessagesWorkspaceProps {
  role: MessagesRole;
}

export default function MessagesWorkspace({ role }: MessagesWorkspaceProps) {
  const { t } = useTranslation();
  const { schoolId } = useParams<{ schoolId: string }>();
  const { fetchNotifications } = useNotifications();
  const [searchParams] = useSearchParams();
  const autoOpenedRef = useRef(false);

  const [rows, setRows] = useState<Conversation[]>([]);
  const [selectedRow, setSelectedRow] = useState<Conversation | null>(null);
  const [thread, setThread] = useState<Message[] | null>(null);
  const [threadMeta, setThreadMeta] = useState<ConversationThread['conversation'] | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [sendingGroup, setSendingGroup] = useState(false);

  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchList = useCallback(async () => {
    if (!schoolId) return;
    try {
      const res = await messageService.getConversations(schoolId);
      setRows(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingList(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchList();
    const interval = setInterval(fetchList, 20000);
    const onFocus = () => fetchList();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchList]);

  const openThread = useCallback(async (row: Conversation) => {
    setSelectedRow(row);
    setThread([]);
    setThreadMeta(null);
    setDraft('');
    if (!row.conversationId) {
      setLoadingThread(false);
      return;
    }
    setLoadingThread(true);
    try {
      const res = await messageService.getMessages(schoolId!, row.conversationId);
      setThreadMeta(res.data.conversation);
      setThread(res.data.messages);
      setRows((prev) => prev.map((r) => (r.conversationId === row.conversationId ? { ...r, unreadCount: 0 } : r)));
      fetchNotifications();
    } catch {
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  }, [schoolId, fetchNotifications]);

  useEffect(() => {
    if (!schoolId || !selectedRow?.conversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await messageService.getMessages(schoolId, selectedRow.conversationId!);
        setThread(res.data.messages);
        setRows((prev) => prev.map((r) => (r.conversationId === selectedRow.conversationId ? { ...r, unreadCount: 0 } : r)));
        fetchNotifications();
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [schoolId, selectedRow?.conversationId, fetchNotifications]);

  useEffect(() => {
    const target = searchParams.get('conversation');
    if (!target || autoOpenedRef.current || rows.length === 0) return;
    const row = rows.find((r) => r.conversationId === target);
    if (row) {
      autoOpenedRef.current = true;
      openThread(row);
    }
  }, [rows, searchParams, openThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread, loadingThread]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !selectedRow || !schoolId || sending) return;
    setSending(true);
    try {
      const res = await messageService.sendMessage(schoolId, {
        content,
        receiverId: selectedRow.participantId,
        studentId: selectedRow.studentId,
        conversationId: selectedRow.conversationId || undefined,
      });
      const conversationId = res.data?.conversationId;
      setThread((prev) => [...(prev || []), { ...res.data, content, mine: true } as Message]);
      if (conversationId && !selectedRow.conversationId) {
        setSelectedRow((prev) => (prev ? { ...prev, conversationId, id: conversationId } : prev));
      }
      setDraft('');
      fetchList();
    } catch (e: any) {
      setSnack({ message: e?.response?.data?.message || t('messages.sendFailed'), severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const openDialog = async () => {
    setDialogOpen(true);
    setRecipientsLoading(true);
    try {
      const res = await messageService.getRecipients(schoolId!);
      setRecipients(res.data || []);
    } catch {
      setSnack({ message: t('messages.recipientsLoadFailed'), severity: 'error' });
    } finally {
      setRecipientsLoading(false);
    }
  };

  const handleGroupSend = async (selectedIds: string[], content: string) => {
    if (!schoolId) return;
    setSendingGroup(true);
    try {
      const payload = role === 'teacher'
        ? { content, studentIds: selectedIds }
        : { content, parentIds: selectedIds };
      await messageService.sendGroup(schoolId, payload);
      const unit = role === 'teacher' ? t('messages.studentUnit') : t('messages.parentUnit');
      setSnack({ message: t('messages.groupSent', { count: selectedIds.length, unit }), severity: 'success' });
      setDialogOpen(false);
      fetchList();
    } catch (e: any) {
      setSnack({ message: e?.response?.data?.message || t('messages.groupSendFailed'), severity: 'error' });
    } finally {
      setSendingGroup(false);
    }
  };

  const subtitle = role === 'school_admin'
    ? t('messages.adminSubtitle')
    : role === 'teacher'
      ? t('messages.teacherSubtitle')
      : t('messages.parentSubtitle');

  return (
    <Box>
      <PageHeader
        title={t('messages.messages')}
        subtitle={subtitle}
        action={
          role !== 'parent' ? (
            <Button variant="contained" startIcon={<GroupsIcon />} onClick={openDialog}>
              {t('messages.newMessage')}
            </Button>
          ) : undefined
        }
      />

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', height: { xs: 'calc(100dvh - 155px)', md: 640 } }}>
        <Box display="flex" sx={{ height: '100%' }}>
          <ConversationList
            rows={rows}
            loading={loadingList}
            selectedKey={selectedRow ? rowKey(selectedRow) : null}
            onSelect={openThread}
            showStudentName={role !== 'parent'}
            hideOnMobile={!!selectedRow}
          />
          <ConversationThreadView
            selectedRow={selectedRow}
            threadMeta={threadMeta}
            thread={thread}
            loadingThread={loadingThread}
            draft={draft}
            sending={sending}
            scrollRef={scrollRef}
            onDraftChange={setDraft}
            onSend={handleSend}
            onBack={() => setSelectedRow(null)}
          />
        </Box>
      </Paper>

      <NewMessageDialog
        open={dialogOpen}
        role={role}
        recipients={recipients}
        loading={recipientsLoading}
        sending={sendingGroup}
        onClose={() => setDialogOpen(false)}
        onSend={handleGroupSend}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity} onClose={() => setSnack(null)} sx={{ width: '100%' }}>
          {snack?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
