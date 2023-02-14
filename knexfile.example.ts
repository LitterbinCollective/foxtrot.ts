import type { Knex } from 'knex';

// import appConfig from '@/configs/app.json';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3',
    },
    useNullAsDefault: true,
  },

  production: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: 5432,
      user: 'glowmem',
      password: '1',
      database: 'glowmem',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

module.exports = config;
