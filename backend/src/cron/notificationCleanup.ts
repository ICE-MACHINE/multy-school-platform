import cron, { type ScheduledTask } from 'node-cron';
import { AppDataSource } from '../config/data-source';
import { Notification } from '../modules/notification/notification.entity';
import {
  isNotificationDeletable,
  RETENTION_POLICY,
} from '../modules/notification/notificationIntelligence';
import { env } from '../config/env';
import { logger } from '../shared/utils/logger';

export { RETENTION_POLICY };

/**
 * Explicit retention policy (see notificationIntelligence.RETENTION_POLICY):
 * - critical notifications are never auto-deleted;
 * - audit-relevant types (absence, payment) are kept 365 days once read;
 * - low-value read types (message, activity) 30 days, standard read 90 days;
 * - unread: low 90 days, standard 180 days.
 * Nothing is deleted merely for being read, so notifications needed for
 * audit/disputes survive until their retention window expires.
 */
export async function cleanupOldNotifications(now: Date = new Date()) {
  const notificationRepo = AppDataSource.getRepository(Notification);
  const minAgeDays = Math.min(
    RETENTION_POLICY.readLowDays,
    RETENTION_POLICY.readStandardDays,
    RETENTION_POLICY.unreadLowDays,
  );
  const cutoff = new Date(now.getTime() - minAgeDays * 24 * 60 * 60 * 1000);

  const candidates = await notificationRepo
    .createQueryBuilder('notification')
    .where('notification.createdAt < :cutoff', { cutoff })
    .getMany();

  const deletable = candidates.filter((n) => isNotificationDeletable(n, now));
  let deleted = 0;
  const batchSize = 500;
  for (let i = 0; i < deletable.length; i += batchSize) {
    const batch = deletable.slice(i, i + batchSize);
    if (batch.length === 0) continue;
    const result = await notificationRepo.remove(batch);
    deleted += Array.isArray(result) ? result.length : batch.length;
  }

  logger.info(
    `[NotificationCleanup] Deleted ${deleted} notification(s) past retention (kept ${candidates.length - deletable.length} within policy)`,
  );
  return { deleted, kept: candidates.length - deletable.length };
}

export function startNotificationCleanupScheduler(): ScheduledTask {
  const task = cron.schedule(
    env.cron.notificationCleanup,
    async () => {
      try {
        await cleanupOldNotifications();
      } catch (error) {
        logger.error('[NotificationCleanup] فشل تنظيف الإشعارات:', error);
      }
    },
    {
      name: 'notification-cleanup',
      timezone: env.cron.timezone,
      noOverlap: true,
    }
  );

  logger.info(
    `[NotificationCleanup] تم جدولة تنظيف الإشعارات يومياً عند ${env.cron.notificationCleanup} (${env.cron.timezone})`
  );
  return task;
}
