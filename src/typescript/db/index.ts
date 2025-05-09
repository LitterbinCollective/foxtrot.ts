import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import config from '@/managers/config';

import * as schema from './schema';

const pool = new Pool({
  connectionString: config.app.databaseDSN,
});

export const db = drizzle(pool, { schema });

export * as Schema from './schema';
export * as Types from './types';