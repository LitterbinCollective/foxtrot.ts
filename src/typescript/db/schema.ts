import { pgTable, varchar, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

export const guildSettingsLangEnum = pgEnum('langSetting', [ 'en', 'ja', 'krRu', 'ru', 'sv', 'ua' ]);
export const guildSettingsTTSEnum = pgEnum('ttsSetting', [ 'chatsounds', 'yandex' ]);

export const guildSettings = pgTable('guildSettings', {
  guildId: varchar('guildId', { length: 255 }).primaryKey(),
  prefix: varchar('prefix', { length: 255 }),
  special: boolean('special').notNull().default(false),
  allowCorrupt: boolean('allowCorrupt').notNull().default(false),
  lang: guildSettingsLangEnum('lang').default('en'),
  ephemeral: boolean('ephemeral').notNull().default(true),
  defaultVolume: integer('defaultVolume').notNull().default(100),
  tts: guildSettingsTTSEnum('tts'),
  ttsTellMessageAuthor: boolean('ttsTellMessageAuthor').notNull().default(false),
  ttsTellJoinLeave: boolean('ttsTellJoinLeave').notNull().default(false),
});
