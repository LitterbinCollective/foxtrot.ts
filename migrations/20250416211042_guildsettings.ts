import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.integer('defaultVolume').notNullable().defaultTo(100);
    table.string('tts');
    table.boolean('ttsTellMessageAuthor').notNullable().defaultTo(false);
    table.boolean('ttsTellJoinLeave').notNullable().defaultTo(false);
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('guildSettings', table => {
    table.dropColumn('defaultVolume');
    table.dropColumn('tts');
    table.dropColumn('ttsTellMessageAuthor');
    table.dropColumn('ttsTellJoinLeave');
  });
}

