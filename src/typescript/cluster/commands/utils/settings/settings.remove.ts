import {
  CommandClient,
  Constants as DetritusConstants
} from 'detritus-client';
import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { guildSettings } from '@/db/schema';
import { db } from '@/db';
import { UserError, listSettings } from '@cluster/utils';

import { BaseSettingsCommand, SettingsContext } from './settings';
import app from '@cluster/index';

export default class SettingsRemoveCommand extends BaseSettingsCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings remove',
      aliases: ['settings rm'],
      type: [
        {
          name: 'key',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: SettingsContext, { key }: { key: string }) {
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
    return await ctx.reply({ embed });
  }
}
