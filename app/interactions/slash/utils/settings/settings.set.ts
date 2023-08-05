import { Constants as DetritusConstants, Utils } from 'detritus-client';

import {
  BaseSettingsCommandOption,
  SettingChoices,
  SettingsInteractionContext
} from './settings';
import { GuildSettings } from '@/modules/models';
import { Constants, UserError, convertToType } from '@/modules/utils';
import { listSettings } from '@/modules/utils/shard-specific';

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
    const { properties } = GuildSettings.jsonSchema;

    const attribute = properties[key as keyof typeof properties];
    if (!attribute || key === GuildSettings.idColumn)
      throw new UserError('commands.settings.unknown');

    let type = attribute.type;

    if (Array.isArray(type)) type = type[0];
    else type = type.split(',')[0];
    value = convertToType(value, type);

    await ctx.settings.$query().patch({ [key]: value });

    const embed = await listSettings(ctx.guild, ctx.settings);
    embed.setTitle(
      Constants.EMOJIS.CHECK +
        ' ' +
        (await this.t(ctx, 'commands.settings.set', key, value))
    );
    return await ctx.editOrRespond({ embed });
  }
}