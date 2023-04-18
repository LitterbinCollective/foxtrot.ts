import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.boolean('allowCorrupt').notNullable().defaultTo(0);
    table.string('lang');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.dropColumn('allowCorrupt');
    table.dropColumn('lang');
  });
}
