import { Knex } from 'knex';

export default interface ConfigKnex {
  [key: string]: Knex.Config | undefined;
  development: Knex.Config;
  production: Knex.Config;
}