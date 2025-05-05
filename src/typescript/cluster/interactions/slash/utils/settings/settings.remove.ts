import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { UserError, listSettings } from '@cluster/utils';
import { db } from '@/db';
import { guildSettings } from '@/db/schema';
import app from '@cluster/index';

import {
  BaseSettingsCommandOption,
  SettingChoices,
  SettingsInteractionContext
} from './settings';

export class SettingsRemoveCommand extends BaseSettingsCommandOption {
  public name = 'remove';
  public description = "remove a setting's value (if possible)";

  constructor() {
    super({
      options: [
        {
          name: 'key',
          description: 'setting name.',
          choices: SettingChoices,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: SettingsInteractionContext, { key }: { key: string }) {
    if (!ctx.guild) return;
    const { columns } = getTableConfig(guildSettings);

    const attribute = columns.find(x => x.name === key);
    if (!attribute || attribute.primary)
      throw new UserError('commands.settings.unknown');

    if (attribute.notNull)
      throw new UserError('commands.settings.not-null');

    await db
      .update(guildSettings)
      .set({ [key]: null })
      .where(eq(guildSettings.guildId, ctx.guild.id));

    (ctx.settings as any)[key] = null; // when push comes to shove

    const embed = await listSettings(ctx.guild, ctx.settings);
    embed.setTitle(
      app.emoji('CHECK') +
        ' ' +
        (await this.t(
          ctx,
          'commands.settings.set',
          key,
          await this.t(ctx, 'commands.settings.no-value')
        ))
    );
    return await ctx.editOrRespond({ embed });
  }
}