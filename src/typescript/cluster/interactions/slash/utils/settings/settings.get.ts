import { Utils } from 'detritus-client';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { UserError } from '@cluster/utils';

import {
  BaseSettingsCommandOption,
  SettingChoices,
  SettingsInteractionContext
} from './settings';
import { guildSettings } from '@/db/schema';

export class SettingsGetCommand extends BaseSettingsCommandOption {
  public name = 'get';
  public description = "get a setting's value";

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

    let value = ctx.settings[key as keyof typeof ctx.settings];
    if (value === undefined || value === null)
      value = await this.t(ctx, 'commands.settings.no-value');

    return await ctx.editOrRespond(Utils.Markup.codestring(value.toString()));
  }
}