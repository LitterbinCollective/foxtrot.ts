import { defineConfig } from 'drizzle-kit';

process.env.MANAGER_WATCH_DISABLE = '1';
import config from './src/typescript/managers/config';

export default defineConfig({
  schema: './src/typescript/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.app.databaseDSN,
  },
});
