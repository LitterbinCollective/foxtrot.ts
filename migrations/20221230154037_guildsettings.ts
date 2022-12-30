import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.boolean('special').notNullable().defaultTo(1);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.dropColumn('special');
  });
}
