export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface NotificationLike {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
  recipientId: string;
}

const PRIORITY_RANK: Record<NotificationPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function classifyNotificationPriority(n: Pick<NotificationLike, 'type' | 'title' | 'message'>): NotificationPriority {
  const text = `${n.title} ${n.message}`.toLowerCase();
  if (/urgent|critical|overdue|unpaid|متأخر|عاجل|غير مبرر|unjustified/.test(text)) {
    return n.type === 'absence' || n.type === 'payment' ? 'critical' : 'high';
  }
  switch (n.type) {
    case 'absence':
      return 'high';
    case 'payment':
      return 'medium';
    case 'schedule_change':
      return 'medium';
    case 'message':
      return 'low';
    case 'activity':
      return 'low';
    default:
      return 'medium';
  }
}

export function notificationGroupKey(n: NotificationLike): string {
  const day = new Date(n.createdAt).toISOString().slice(0, 10);
  const basis = (n.link || n.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${n.recipientId}|${n.type}|${basis}|${day}`;
}

export interface NotificationGroup {
  groupKey: string;
  type: string;
  priority: NotificationPriority;
  count: number;
  unreadCount: number;
  latestAt: string;
  sampleTitle: string;
  notificationIds: string[];
}

export function groupNotifications(list: NotificationLike[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  for (const n of list) {
    const key = notificationGroupKey(n);
    const priority = classifyNotificationPriority(n);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      if (!n.isRead) existing.unreadCount += 1;
      existing.notificationIds.push(n.id);
      if (PRIORITY_RANK[priority] < PRIORITY_RANK[existing.priority]) existing.priority = priority;
      if (new Date(n.createdAt).getTime() > new Date(existing.latestAt).getTime()) {
        existing.latestAt = new Date(n.createdAt).toISOString();
        existing.sampleTitle = n.title;
      }
    } else {
      groups.set(key, {
        groupKey: key,
        type: n.type,
        priority,
        count: 1,
        unreadCount: n.isRead ? 0 : 1,
        latestAt: new Date(n.createdAt).toISOString(),
        sampleTitle: n.title,
        notificationIds: [n.id],
      });
    }
  }
  return [...groups.values()].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
  );
}

export interface NotificationDigest {
  periodDays: number;
  total: number;
  unread: number;
  duplicatesCollapsed: number;
  byType: Record<string, number>;
  byPriority: Record<NotificationPriority, number>;
  groups: NotificationGroup[];
  urgentUnread: NotificationGroup[];
}

export function buildNotificationDigest(
  list: NotificationLike[],
  periodDays: number,
  now: Date = new Date(),
): NotificationDigest {
  const cutoff = now.getTime() - periodDays * 24 * 60 * 60 * 1000;
  const inPeriod = list.filter((n) => new Date(n.createdAt).getTime() >= cutoff);
  const groups = groupNotifications(inPeriod);
  const byType: Record<string, number> = {};
  const byPriority: Record<NotificationPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const n of inPeriod) {
    byType[n.type] = (byType[n.type] || 0) + 1;
    byPriority[classifyNotificationPriority(n)] += 1;
  }
  return {
    periodDays,
    total: inPeriod.length,
    unread: inPeriod.filter((n) => !n.isRead).length,
    duplicatesCollapsed: inPeriod.length - groups.length,
    byType,
    byPriority,
    groups,
    urgentUnread: groups
      .filter((g) => g.unreadCount > 0 && (g.priority === 'critical' || g.priority === 'high'))
      .slice(0, 5),
  };
}

export function suggestSendTime(priority: NotificationPriority, now: Date = new Date()): { at: string; code: string } {
  if (priority === 'critical' || priority === 'high') {
    return { at: now.toISOString(), code: 'send_immediately' };
  }
  const next = new Date(now);
  const hour = next.getHours();
  if (hour < 8) {
    next.setHours(8, 0, 0, 0);
    return { at: next.toISOString(), code: 'next_morning_window_08_19' };
  }
  if (hour >= 19) {
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
    return { at: next.toISOString(), code: 'next_morning_window_08_19' };
  }
  return { at: now.toISOString(), code: 'within_daytime_window_08_19' };
}

export const RETENTION_POLICY = {
  readLowDays: 30,
  readStandardDays: 90,
  readAuditDays: 365,
  unreadLowDays: 90,
  unreadStandardDays: 180,
} as const;

const AUDIT_TYPES = new Set(['absence', 'payment']);
const LOW_TYPES = new Set(['message', 'activity']);

export function isNotificationDeletable(
  n: NotificationLike & { type: string },
  now: Date = new Date(),
): boolean {
  const ageDays = (now.getTime() - new Date(n.createdAt).getTime()) / (24 * 60 * 60 * 1000);
  const priority = classifyNotificationPriority(n);
  if (priority === 'critical') return false;
  if (n.isRead) {
    if (AUDIT_TYPES.has(n.type)) return ageDays > RETENTION_POLICY.readAuditDays;
    if (LOW_TYPES.has(n.type)) return ageDays > RETENTION_POLICY.readLowDays;
    return ageDays > RETENTION_POLICY.readStandardDays;
  }
  if (LOW_TYPES.has(n.type)) return ageDays > RETENTION_POLICY.unreadLowDays;
  return ageDays > RETENTION_POLICY.unreadStandardDays;
}
