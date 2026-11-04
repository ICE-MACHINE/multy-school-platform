import type { Conversation, Message } from '../../types';
import i18n from '../../i18n';

const AVATAR_COLORS = ['#0f62fe', '#24a148', '#8a3ffc', '#ee5396', '#ff832b', '#08bdba'];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const rowKey = (row: Conversation) => row.conversationId ?? `new:${row.participantId}:${row.studentId ?? ''}`;

export function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
}

export function formatListTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return i18n.t('common.today');
  if (isSameDay(d, yesterday)) return i18n.t('notifications.yesterday');
  return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' });
}

export interface DaySection {
  label: string;
  messages: Message[];
}

export function groupByDay(messages: Message[]): DaySection[] {
  const sections: DaySection[] = [];
  for (const m of messages) {
    const label = dayLabel(m.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.label === label) last.messages.push(m);
    else sections.push({ label, messages: [m] });
  }
  return sections;
}

export function listSectionLabel(iso: string | null): string {
  if (!iso) return i18n.t('common.today');
  return dayLabel(iso);
}
