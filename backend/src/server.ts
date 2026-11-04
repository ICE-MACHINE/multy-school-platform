import 'reflect-metadata';
import type {} from './shared/interfaces/express';
import app from './app';
import { AppDataSource } from './config/data-source';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { connectRedis } from './config/redis';
import { startNotificationCleanupScheduler } from './cron/notificationCleanup';

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully');

    if (env.NODE_ENV === 'production') {
      const hasPendingMigrations = await AppDataSource.showMigrations();
      if (hasPendingMigrations) {
        logger.error(
          'Pending database migrations detected. Apply the reviewed migrations first (NODE_ENV=production npm run migration:run), then start the app. ' +
          'Never generate migrations on the production server — see backend/MIGRATIONS.md.',
        );
        process.exit(1);
      }
    }

    await connectRedis();

    startNotificationCleanupScheduler();

    const PORT = env.PORT;
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();