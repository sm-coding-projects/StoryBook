import 'dotenv/config';
import PgBoss from 'pg-boss';
import { processPhotoHandler } from './handlers/process-photo.js';
import { generateExportHandler } from './handlers/generate-export.js';
import { JOB_PROCESS_PHOTO, JOB_GENERATE_EXPORT } from '@gallery/shared';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

async function main() {
  console.log('[Worker] Starting pg-boss worker...');

  const boss = new PgBoss(DATABASE_URL);

  boss.on('error', (error) => {
    console.error('[Worker] pg-boss error:', error);
  });

  await boss.start();
  console.log('[Worker] pg-boss started successfully');

  // pg-boss v10: queues (and their job-table partitions) must exist before
  // jobs can be inserted — the web app enqueues via direct insert RPC.
  await boss.createQueue(JOB_PROCESS_PHOTO);
  await boss.createQueue(JOB_GENERATE_EXPORT);

  // pg-boss v10 handlers receive a batch of jobs.
  await boss.work<{ photoId: string }>(
    JOB_PROCESS_PHOTO,
    { batchSize: 3 },
    async (jobs) => {
      await Promise.all(jobs.map((job) => processPhotoHandler(job)));
    }
  );
  console.log(`[Worker] Listening for ${JOB_PROCESS_PHOTO} jobs`);

  await boss.work<{ exportId: string }>(
    JOB_GENERATE_EXPORT,
    { batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        await generateExportHandler(job);
      }
    }
  );
  console.log(`[Worker] Listening for ${JOB_GENERATE_EXPORT} jobs`);

  console.log('[Worker] Ready and waiting for jobs...');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[Worker] Shutting down...');
    await boss.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
