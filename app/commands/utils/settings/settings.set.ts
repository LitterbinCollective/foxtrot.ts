import { CommandClient, Constants as DetritusConstants, Utils } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { Constants, convertToType, listSettings } from '@/modules/utils';

import { BaseSettingsCommand, SettingsContext } from './settings';

export default class SettingsSetCommand extends BaseSettingsCommand {
  public manageGuildOnly = true;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'settings set',
      type: [
        { name: 'key', type: DetritusConstants.CommandArgumentTypes.STRING, required: true },
        { name: 'value', type: DetritusConstants.CommandArgumentTypes.STRING, required: true },
      ],
    });
  }

  public async run(ctx: SettingsContext, { key, value }: { key: string; value: any }) {
    if (!ctx.guild) return;
    const { properties } = GuildSettings.jsonSchema;

    const attribute = properties[key as keyof typeof properties];
    if (!attribute || key === GuildSettings.idColumn)
      throw new Error('unknown setting');

    let type = attribute.type;

    if (Array.isArray(type)) type = type[0];
    else type = type.split(',')[0];
    value = convertToType(value, type);

    await ctx.settings.$query().patch({ [key]: value });

    const embed = listSettings(ctx.settings);
    embed.setTitle(
      Constants.EMOJIS.CHECK +
        ' Set ' +
        Utils.Markup.codestring(key) +
        ' to ' +
        Utils.Markup.codestring(value)
    );
    ctx.reply({ embed });
  }
}
