import { sql, eq } from 'drizzle-orm';

import { guildSettings } from './schema';
import { db } from '.';

export const getSettingsByGuildId = db
  .select()
  .from(guildSettings)
  .where(eq(guildSettings.guildId, sql.placeholder('guildId')))
  .prepare('getSettingsByGuildId');

export const insertSettings = db
  .insert(guildSettings)
  .values({ guildId: sql.placeholder('guildId') })
  .returning()
  .prepare('insertSettings');

export async function getOrCreateSettings(guildId: string) {
  let [ settings ] = await getSettingsByGuildId.execute({ guildId });
  if (!settings)
    settings = (await insertSettings.execute({ guildId }))[0];

  return settings;
}