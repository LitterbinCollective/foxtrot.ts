import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('guildSettings', table => {
    table.string('guildId').notNullable();
    table.string('prefix');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('guildSettings');
}
