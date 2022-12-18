import type { Knex } from 'knex';

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
      database: 'glowmem',
      user: 'glowmem',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

module.exports = config;
