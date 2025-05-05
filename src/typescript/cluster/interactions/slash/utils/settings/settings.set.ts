import { Constants as DetritusConstants } from 'detritus-client';
import { eq } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';

import {
  BaseSettingsCommandOption,
  SettingChoices,
  SettingsInteractionContext
} from './settings';
import { UserError, listSettings } from '@cluster/utils';
import { convertToType } from '@/utils';
import { guildSettings } from '@/db/schema';
import { db } from '@/db';
import app from '@cluster/index';

export class SettingsSetCommand extends BaseSettingsCommandOption {
  public name = 'set';
  public description = "set a setting's value";

  constructor() {
    super({
      options: [
        {
          name: 'key',
          description: 'setting name.',
          choices: SettingChoices,
          required: true,
        },
        {
          name: 'value',
          description: 'a new value for the selected setting.',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: true
        },
      ],
    });
  }

  public async run(
    ctx: SettingsInteractionContext,
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
    return await ctx.editOrRespond({ embed });
  }
}