import { Utils } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { UserError } from '@/modules/utils';

import {
  BaseSettingsCommandOption,
  SettingChoices,
  SettingsInteractionContext
} from './settings';

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
    const { properties } = GuildSettings.jsonSchema;

    if (
      !properties[key as keyof typeof properties] ||
      key === GuildSettings.idColumn
    )
      throw new UserError('commands.settings.unknown');

    let value = ctx.settings[key as keyof typeof ctx.settings];
    if (value === undefined || value === null)
      value = await this.t(ctx, 'commands.settings.no-value');

    return await ctx.editOrRespond(Utils.Markup.codestring(value.toString()));
  }
}