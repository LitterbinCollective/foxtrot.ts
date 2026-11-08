import {
  CommandClient,
  Constants as DetritusConstants
} from 'detritus-client';
import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';

import {
  UserError,
  listSettings
} from '@cluster/utils';
import { convertToType } from '@/utils';
import { db } from '@/db';
import { guildSettings } from '@/db/schema';
import app from '@cluster/index';

import { BaseSettingsCommand, SettingsContext } from './settings';

export default class SettingsSetCommand extends BaseSettingsCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings set',
      type: [
        {
          name: 'key',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
        {
          name: 'value',
          type: DetritusConstants.CommandArgumentTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: SettingsContext,
    { key, value }: { key: string; value: any }
  ) {
    if (!ctx.guild) return;
    const { columns } = getTableConfig(guildSettings);

    const attribute = columns.find(x => x.name === key);
    if (!attribute || attribute.primary)
      throw new UserError('commands.settings.unknown');

    if (attribute.enumValues) {
      if (!attribute.enumValues.includes(value))
        throw new UserError('commands.argument-error');
    } else
      value = convertToType(value, attribute.columnType);

    await db
      .update(guildSettings)
      .set({ [key]: value })
      .where(eq(guildSettings.guildId, ctx.guild.id));

    (ctx.settings as any)[key] = value; // when push comes to shove

    const embed = await listSettings(ctx.guild, ctx.settings);
    embed.setTitle(
      app.emoji('CHECK') +
        ' ' +
        (await this.t(ctx, 'commands.settings.set', key, value))
    );
    return await ctx.reply({ embed });
  }
}
