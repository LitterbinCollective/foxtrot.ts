import {
  CommandClient,
  Constants as DetritusConstants
} from 'detritus-client';

import { GuildSettings } from '@cluster/models';
import {
  Constants,
  convertToType,
  UserError,
  listSettings
} from '@cluster/utils';

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
    return await ctx.reply({ embed });
  }
}
