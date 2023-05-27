import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.boolean('ephemeral').notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.dropColumn('ephemeral');
  });
}
