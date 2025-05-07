import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { db } from '@/db/';
import { Logger } from '@/utils';

(async function() {
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  Logger.log('migration complete');
  process.exit();
})();