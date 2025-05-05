import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { db } from '@/db/';

(async function() {
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('migration complete');
  process.exit();
})();